import asyncio
import math
import time
import json
import ssl
import urllib.request
import urllib.parse
import csv
from datetime import datetime, timedelta
from typing import Any, Dict, List
from zoneinfo import ZoneInfo


# Trend windows (in hours) offered in the UI dropdown.
PEGEL_TREND_WINDOWS = [1, 3, 6, 12, 24]

BRIGHTSKY_API = "https://api.brightsky.dev"
BERLIN_TZ = ZoneInfo("Europe/Berlin")

# Bright Sky icon -> German display text, ordered by severity (used to pick a
# day's representative condition).
_ICON_CONDITIONS = [
    ("clear-day", "Sonnig"),
    ("clear-night", "Klar"),
    ("partly-cloudy-day", "Teils bewölkt"),
    ("partly-cloudy-night", "Teils bewölkt"),
    ("cloudy", "Bewölkt"),
    ("wind", "Windig"),
    ("fog", "Nebel"),
    ("rain", "Regen"),
    ("sleet", "Schneeregen"),
    ("snow", "Schneefall"),
    ("hail", "Hagel"),
    ("thunderstorm", "Gewitter"),
]
_ICON_TEXT = dict(_ICON_CONDITIONS)
_ICON_RANK = {icon: rank for rank, (icon, _) in enumerate(_ICON_CONDITIONS)}


def _icon_to_condition(icon) -> str:
    return _ICON_TEXT.get(icon, "--")


def _icon_severity(icon) -> int:
    return _ICON_RANK.get(icon, -1)


def _num(value, default: float = 0.0) -> float:
    """Bright Sky returns null for values a station/forecast does not provide."""
    return default if value is None else value


def _wind_dir(deg) -> str:
    if deg is None:
        return "--"
    dirs = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[int((deg / 22.5) + .5) % 16]


# DWD warning severity (CAP) -> official DWD Warnstufe 1-4.
_SEVERITY_LEVEL = {"minor": 1, "moderate": 2, "severe": 3, "extreme": 4}


def _official_warnings(alerts: list, now: datetime) -> Dict[str, Any]:
    """Currently active official DWD warnings for the location, most severe first."""
    active = []
    for alert in alerts:
        try:
            onset = datetime.fromisoformat(alert["onset"]) if alert.get("onset") else None
            expires = datetime.fromisoformat(alert["expires"]) if alert.get("expires") else None
        except (TypeError, ValueError):
            onset = expires = None
        if (onset and onset > now) or (expires and expires <= now):
            continue
        active.append({
            "level": _SEVERITY_LEVEL.get(alert.get("severity"), 1),
            "event": alert.get("event_de") or "",
            "headline": alert.get("headline_de") or alert.get("event_de") or "Wetterwarnung",
            "onset": alert.get("onset"),
            "expires": alert.get("expires"),
        })
    active.sort(key=lambda a: a["level"], reverse=True)
    if not active:
        text = "Keine amtlichen Wetterwarnungen des DWD."
    else:
        text = active[0]["headline"]
        if len(active) > 1:
            text += f" (+{len(active) - 1} weitere)"
    return {
        "warning_level": active[0]["level"] if active else 0,
        "warning_text": text,
        "warnings_available": True,
        "warnings": active,
    }

# Default AUTO refresh cadences (seconds). A 429 temporarily raises the active
# cooldown to RATE_LIMIT_BACKOFF; the next successful fetch restores these.
# FORECAST: 600s (10 min) keeps live weather fresh (2 Bright Sky calls per fetch).
FORECAST_COOLDOWN = 600
PEGEL_COOLDOWN = 300
FIRE_COOLDOWN = 3600
RATE_LIMIT_BACKOFF = 3600

# Minimum gap between two manual (forced) refreshes of the same feed. Manual
# refreshes skip the auto cooldown, and /ws is public, so without this a
# client could fire an unlimited number of upstream requests.
MANUAL_REFRESH_MIN_GAP = 30


def _fetch_allowed(last_fetch: float, cooldown: float, force: bool) -> bool:
    elapsed = time.time() - last_fetch
    return elapsed >= (MANUAL_REFRESH_MIN_GAP if force else cooldown)


def manual_refresh_retry_in(last_fetch: float) -> int:
    """Seconds until a manual refresh of a feed fetched at `last_fetch` is allowed."""
    return max(0, math.ceil(MANUAL_REFRESH_MIN_GAP - (time.time() - last_fetch)))


def _log_rate_limited(source: str, e: Exception):
    """Print the body of a 429 response - it names which limit was hit
    (e.g. Open-Meteo: "Daily API request limit exceeded")."""
    try:
        body = e.read().decode("utf-8", errors="replace")
    except Exception:
        body = "<no body>"
    print(f"{source} rate limited (429), backing off {RATE_LIMIT_BACKOFF}s. Response: {body}")


def _pegel_trend_map(values: list) -> Dict[str, str]:
    """Compute a 15-min least-squares slope for each trend window.

    A raw 1h point-difference flips sign constantly because the 15-min
    readings wobble +-2 cm; a least-squares slope over the chosen window
    smooths that noise and reflects the real water-level trend.
    Returns {hours: f"{sign}{delta} cm"} for every window in PEGEL_TREND_WINDOWS.
    """
    result: Dict[str, str] = {}
    for hours in PEGEL_TREND_WINDOWS:
        window = values[-(hours * 4):]  # 4 x 15-min steps per hour
        n = len(window)
        if n < 2:
            result[str(hours)] = "0 cm"
            continue
        ys = window
        mean_x = (n - 1) / 2.0
        mean_y = sum(ys) / n
        denom = sum((i - mean_x) ** 2 for i in range(n))
        slope_15min = (sum((i - mean_x) * (ys[i] - mean_y) for i in range(n)) / denom) if denom else 0.0
        delta = round(slope_15min * hours * 4, 1)
        result[str(hours)] = f"{'+' if delta > 0 else ''}{delta} cm"
    return result


class TelemetryService:
    def __init__(self):
        self.ssl_ctx = ssl.create_default_context()
        self.ssl_ctx.check_hostname = False
        self.ssl_ctx.verify_mode = ssl.CERT_NONE
        self.broadcast_callback = None
        self.current_city = "Berlin"
        self.lat = 52.52
        self.lon = 13.40
        self.stations = []
        
        self._manual_trigger = asyncio.Event()
        self.get_active_clients = None

        # Active AUTO refresh cadences (raised on 429, restored on success).
        self.forecast_cooldown = FORECAST_COOLDOWN
        self.pegel_cooldown = PEGEL_COOLDOWN
        self.fire_cooldown = FIRE_COOLDOWN
        self._last_forecast_fetch = 0
        self._last_pegel_fetch = 0
        self._last_fire_fetch = 0
        
        # Initial cached telemetry state
        self.data: Dict[str, Any] = {
            "water_levels": [],
            "fire_missions_yesterday": 0,
            "fire_data_date": "--",
            "mission_count_ems": 0,
            "mission_count_tech": 0,
            "mission_count_all": 0,
            "weather": {
                "temperature_c": 0,
                "wind_speed_kmh": 0,
                "wind_gusts_kmh": 0,
                "wind_direction": "--",
                "precipitation_mm": 0,
                "air_pressure_hpa": 0,
                "warning_level": 0,
                "warning_text": "Warte auf Daten..."
            },
            "forecast_7days": []
        }

    async def _get_json(self, url: str, timeout: float = 5):
        req = urllib.request.Request(url, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
        loop = asyncio.get_running_loop()
        res_bytes = await loop.run_in_executor(
            None,
            lambda: urllib.request.urlopen(req, context=self.ssl_ctx, timeout=timeout).read()
        )
        return json.loads(res_bytes.decode("utf-8"))

    async def fetch_forecast_live(self, force=False):
        """Fetches current weather, 24h hourly and 7-day forecast from Bright Sky
        (free DWD data: SYNOP observations + MOSMIX forecasts, no API key and no
        per-IP daily quota - unlike Open-Meteo, whose shared limit other tenants
        on the hosting provider's IP kept exhausting)."""
        if not _fetch_allowed(self._last_forecast_fetch, self.forecast_cooldown, force):
            return "skipped"
        self._last_forecast_fetch = time.time()
        try:
            now = datetime.now(BERLIN_TZ)
            first_date = now.date().isoformat()
            last_date = (now + timedelta(days=8)).date().isoformat()
            base = f"lat={self.lat}&lon={self.lon}&tz=Europe%2FBerlin"
            current_raw, hourly_raw, alerts_raw = await asyncio.gather(
                self._get_json(f"{BRIGHTSKY_API}/current_weather?{base}"),
                self._get_json(f"{BRIGHTSKY_API}/weather?{base}&date={first_date}&last_date={last_date}"),
                self._get_json(f"{BRIGHTSKY_API}/alerts?lat={self.lat}&lon={self.lon}&tz=Europe%2FBerlin"),
                return_exceptions=True,
            )
            # Weather data is required; the warnings feed failing on its own
            # only marks the warnings as unavailable (never as "no warnings").
            for res in (current_raw, hourly_raw):
                if isinstance(res, BaseException):
                    raise res
            self.forecast_cooldown = FORECAST_COOLDOWN

            # Update current weather
            current = current_raw.get("weather") or {}
            if current:
                self.data["weather"] = {
                    "temperature_c": round(_num(current.get("temperature")), 1),
                    "wind_speed_kmh": round(_num(current.get("wind_speed_10")), 1),
                    "wind_gusts_kmh": round(_num(current.get("wind_gust_speed_10")), 1),
                    "wind_direction": _wind_dir(current.get("wind_direction_10")),
                    "precipitation_mm": round(_num(current.get("precipitation_60")), 1),
                    "air_pressure_hpa": round(_num(current.get("pressure_msl"), 1013), 1),
                }
            if isinstance(alerts_raw, BaseException):
                print(f"Error fetching DWD warnings (Bright Sky): {alerts_raw}")
                warnings = {"warning_level": 0, "warning_text": "DWD-Warnungen derzeit nicht abrufbar.",
                            "warnings_available": False, "warnings": []}
            else:
                warnings = _official_warnings(alerts_raw.get("alerts") or [], now)
            self.data["weather"] = {**self.data.get("weather", {}), **warnings}

            hours = []
            for rec in hourly_raw.get("weather") or []:
                try:
                    hours.append((datetime.fromisoformat(rec["timestamp"]).astimezone(BERLIN_TZ), rec))
                except (KeyError, TypeError, ValueError):
                    continue

            # Update 24h hourly forecast (current hour + 24)
            current_hour = now.replace(minute=0, second=0, microsecond=0)
            self.data["forecast_24h"] = [
                {
                    "time": dt_h.strftime("%H:%M"),
                    "temperature_c": round(_num(rec.get("temperature")), 1),
                    "precipitation_mm": round(_num(rec.get("precipitation")), 1),
                    "wind_speed_kmh": round(_num(rec.get("wind_speed")), 1),
                    "condition": _icon_to_condition(rec.get("icon")),
                }
                for dt_h, rec in hours if dt_h >= current_hour
            ][:25]

            # Aggregate hourly records into days (tomorrow + 6)
            by_day: Dict[str, list] = {}
            for dt_h, rec in hours:
                by_day.setdefault(dt_h.date().isoformat(), []).append((dt_h, rec))

            forecast_list = []
            german_days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
            for i in range(1, 8):
                day = now + timedelta(days=i)
                date_str = day.date().isoformat()
                recs = [rec for _, rec in by_day.get(date_str, [])]
                if not recs:
                    continue

                def values(key: str) -> List[float]:
                    return [rec[key] for rec in recs if rec.get(key) is not None]

                temps = values("temperature")
                t_min = round(min(temps), 1) if temps else 0
                t_max = round(max(temps), 1) if temps else 0
                rain_prob = max(values("precipitation_probability"), default=0)
                gusts = round(max(values("wind_gust_speed"), default=0), 1)
                wind_speed = round(max(values("wind_speed"), default=0), 1)
                precip_sum = round(sum(values("precipitation")), 1)

                # Daily condition = most severe daytime (06-21h) icon, like Open-Meteo's daily weathercode
                daytime = [rec.get("icon") for dt_h, rec in by_day[date_str] if 6 <= dt_h.hour <= 21]
                icon = max(daytime or [rec.get("icon") for rec in recs], key=_icon_severity)
                thunderstorm = any(rec.get("condition") == "thunderstorm" for rec in recs)

                risk = "Normal"
                if gusts > 65 or rain_prob > 70 or thunderstorm or precip_sum > 25:
                    risk = "Unwettergefahr"
                elif gusts > 45 or rain_prob > 40 or precip_sum > 10:
                    risk = "Erhöht"

                # No uv_index: Bright Sky/DWD MOSMIX has no UV data, the frontend shows "-".
                forecast_list.append({
                    "date": date_str,
                    "weekday": "Morgen" if i == 1 else german_days[day.weekday()],
                    "temp_min": t_min,
                    "temp_max": t_max,
                    "precipitation_prob": rain_prob,
                    "precipitation_sum": precip_sum,
                    "wind_gusts_kmh": gusts,
                    "wind_speed_kmh": wind_speed,
                    "condition": _icon_to_condition(icon),
                    "warning_risk": risk
                })
            self.data["forecast_7days"] = forecast_list
        except Exception as e:
            if getattr(e, "code", None) == 429:
                self.forecast_cooldown = RATE_LIMIT_BACKOFF
                _log_rate_limited("Bright Sky (DWD)", e)
            if "weather" not in self.data:
                self.data["weather"] = {}
            self.data["weather"]["error"] = str(e)
            print(f"Error fetching Bright Sky (DWD) forecast: {e}")
            return "error"
        return "ok"

    async def init_stations(self):
        """Dynamically fetch river stations based on current lat/lon."""
        try:
            url = f"https://pegelonline.wsv.de/webservices/rest-api/v2/stations.json?latitude={self.lat}&longitude={self.lon}&radius=30&includeTimeseries=true&includeCharacteristicValues=true"
            req = urllib.request.Request(url, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
            loop = asyncio.get_running_loop()
            res_bytes = await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(req, context=self.ssl_ctx, timeout=5).read()
            )
            data = json.loads(res_bytes.decode("utf-8"))
            
            new_stations = []
            
            for item in data:
                station_name = item.get("shortname", "Unbekannt").title()
                uuid = item.get("uuid")
                if not uuid:
                    continue
                
                # Only include stations in Berlin
                if "Berlin" not in station_name and "berlin" not in station_name.lower():
                    continue

                water_obj = item.get("water", {})
                water_name = water_obj.get("longname", water_obj.get("shortname", "Gewässer")).title()
                
                # Some cleanups
                if "Spree-Oder" in water_name:
                    water_name = "Spree"
                elif "Havel-Oder" in water_name:
                    water_name = "Havel"

                # Extract characteristic values from timeseries
                char_vals = {}
                for ts in item.get("timeseries", []):
                    if ts.get("shortname") == "W":
                        for cv in ts.get("characteristicValues", []):
                            shortname = cv.get("shortname")
                            if shortname:
                                char_vals[shortname] = cv.get("value")
                    
                station = {
                    "name": station_name,
                    "water": water_name,
                    "uuid": uuid,
                    "char_vals": char_vals
                }
                
                new_stations.append(station)
            
            self.stations = new_stations
            print(f"Dynamically loaded {len(self.stations)} river stations for {self.current_city}.")
        except Exception as e:
            print(f"Error fetching dynamic stations: {e}")

    async def fetch_pegel_live(self, force=False):
        """Asynchronously updates water levels from Pegelonline WSV API including history."""
        if not _fetch_allowed(self._last_pegel_fetch, self.pegel_cooldown, force):
            return "skipped"
        self._last_pegel_fetch = time.time()
        try:
            await self._fetch_pegel_live_inner()
            self.pegel_cooldown = PEGEL_COOLDOWN
        except Exception as e:
            if getattr(e, "code", None) == 429:
                self.pegel_cooldown = RATE_LIMIT_BACKOFF
                _log_rate_limited("Pegelonline", e)
            self.data["water_levels_error"] = str(e)
            print(f"Error fetching Pegel: {e}")
            return "error"
        return "ok"

    async def _fetch_pegel_live_inner(self):
        updated_list = []
        for station in self.stations:
            try:
                # Fetch last 24 hours of data
                url = f"https://pegelonline.wsv.de/webservices/rest-api/v2/stations/{station['uuid']}/W/measurements.json?start=P1D"
                req = urllib.request.Request(url, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
                loop = asyncio.get_running_loop()
                response_bytes = await loop.run_in_executor(
                    None,
                    lambda: urllib.request.urlopen(req, context=self.ssl_ctx, timeout=4).read()
                )
                items = json.loads(response_bytes.decode("utf-8"))
                if items and len(items) >= 1:
                    latest = items[-1]["value"]

                    # Trend (per window) via least-squares slope over the last
                    # N hours of 15-min readings. A raw 1h point-difference
                    # flips sign constantly because the readings wobble +-2 cm;
                    # a slope over the chosen window smooths that noise. The UI
                    # lets the user pick the window (1h/3h/6h/12h/24h).
                    trend_map = _pegel_trend_map([it["value"] for it in items])
                    # Default (server-side) direction uses the 3h window.
                    d3 = trend_map.get("3", "0 cm").replace(" cm", "").replace("+", "")
                    d3 = float(d3 or 0)
                    trend = "steigend" if d3 > 0.5 else ("fallend" if d3 < -0.5 else "gleichbleibend")

                    hw1 = station.get("hw1", 400)

                    # Extract history for recharts
                    history = [{"time": item["timestamp"], "value": item["value"]} for item in items[::4]] # Keep every 4th point (1h)
                    
                    char_vals = station.get("char_vals", {})
                    
                    updated_list.append({
                        "station": f"{station.get('water', 'Gewässer')} / {station['name']}",
                        "level_cm": round(latest),
                        "trend": trend,
                        "delta_3h": trend_map.get("3", "0 cm"),
                        "trend_map": trend_map,
                        "max_normal": hw1,
                        "char_vals": char_vals,
                        "history": history
                    })
            except Exception as e:
                if getattr(e, "code", None) == 429:
                    raise
                print(f"Error fetching Pegel {station['name']}: {e}")

        if updated_list:
            self.data["water_levels"] = updated_list

    async def fetch_fire_data_live(self, force=False):
        """Fetches the latest Berlin fire missions from the open data CSV."""
        if not _fetch_allowed(self._last_fire_fetch, self.fire_cooldown, force):
            return "skipped"
        self._last_fire_fetch = time.time()
        try:
            url = "https://raw.githubusercontent.com/Berliner-Feuerwehr/BF-Open-Data/main/Datasets/Daily_Data/BFw_mission_data_daily.csv"
            req = urllib.request.Request(url, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
            loop = asyncio.get_running_loop()
            res_bytes = await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(req, context=self.ssl_ctx, timeout=4).read()
            )
            self.fire_cooldown = FIRE_COOLDOWN

            decoded = res_bytes.decode("utf-8").strip().split('\n')
            if len(decoded) > 1:
                # the file has header: mission_created_date,mission_count_all,mission_count_ems,mission_count_ems_critical,mission_count_ems_critical_cpr,mission_count_fire,...
                reader = csv.reader(decoded)
                header = next(reader)
                try:
                    fire_idx = header.index("mission_count_fire")
                    date_idx = header.index("mission_created_date")
                    ems_idx = header.index("mission_count_ems")
                    tech_idx = header.index("mission_count_technical_rescue")
                    all_idx = header.index("mission_count_all")
                except ValueError:
                    print("Error: Required columns not found in BF CSV")
                    return "error"
                
                rows = list(reader)
                if rows:
                    last_row = rows[-1] # The most recent date
                    self.data["fire_missions_yesterday"] = int(last_row[fire_idx])
                    self.data["fire_data_date"] = last_row[date_idx]
                    self.data["mission_count_ems"] = int(last_row[ems_idx])
                    self.data["mission_count_tech"] = int(last_row[tech_idx])
                    self.data["mission_count_all"] = int(last_row[all_idx])
                    
            # Fetch Hauptbeschwerden (ProQA Notrufabfrageprotokoll)
            url_proqa = "https://raw.githubusercontent.com/Berliner-Feuerwehr/BF-Open-Data/main/Datasets/Daily_Data/missions_by_code.csv"
            req_proqa = urllib.request.Request(url_proqa, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
            res_bytes_proqa = await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(req_proqa, context=self.ssl_ctx, timeout=4).read()
            )
            
            # Use 'iso-8859-1' or 'utf-8' with replacement since some chars like 'Ä' might be messed up
            # the earlier curl output showed '' for Umlaute so we'll use latin1 or utf-8 depending on the file
            decoded_proqa = res_bytes_proqa.decode("latin1").strip().split('\n')
            if len(decoded_proqa) > 1:
                reader_proqa = csv.reader(decoded_proqa)
                next(reader_proqa) # skip header
                
                hauptbeschwerden_ytd = []
                total_ytd = 0
                for row in reader_proqa:
                    if len(row) == 2:
                        val = int(row[1])
                        total_ytd += val
                        hauptbeschwerden_ytd.append({
                            "name": row[0],
                            "value": val
                        })
                
                # Sort and take top 7
                top_7_ytd = sorted(hauptbeschwerden_ytd, key=lambda x: x['value'], reverse=True)[:7]
                
                # Scale down to yesterday's EMS total to estimate daily values
                yesterday_ems = self.data["mission_count_ems"]
                daily_hauptbeschwerden = []
                if total_ytd > 0:
                    for h in top_7_ytd:
                        daily_val = int(round((h["value"] / total_ytd) * yesterday_ems))
                        daily_hauptbeschwerden.append({
                            "name": h["name"],
                            "value": daily_val
                        })
                
                self.data["hauptbeschwerden"] = daily_hauptbeschwerden

        except Exception as e:
            if getattr(e, "code", None) == 429:
                self.fire_cooldown = RATE_LIMIT_BACKOFF
                _log_rate_limited("Fire data API", e)
            self.data["fire_data_error"] = str(e)
            print(f"Error fetching fire data: {e}")
            return "error"
        return "ok"

    async def start_polling_loop(self):
        """Periodic background poll for telemetry & forecast."""
        # dynamically fetch stations based on lat/lon
        await self.init_stations()
        
        while True:
            active = self.get_active_clients() if self.get_active_clients else 1
            
            if active > 0:
                try:
                    await asyncio.gather(
                        self.fetch_pegel_live(),
                        self.fetch_forecast_live(),
                        self.fetch_fire_data_live(),
                        return_exceptions=True
                    )
                    if self.broadcast_callback:
                        self.broadcast_callback("TELEMETRY_UPDATED", self.data)
                except Exception as e:
                    print(f"Telemetry loop error: {e}")
                
                try:
                    await asyncio.wait_for(self._manual_trigger.wait(), timeout=60.0)
                    self._manual_trigger.clear()
                except asyncio.TimeoutError:
                    pass
            else:
                await self._manual_trigger.wait()
                self._manual_trigger.clear()


    def trigger_update(self):
        self._manual_trigger.set()

    def get_telemetry_data(self) -> Dict[str, Any]:
        return dict(self.data)

telemetry_service = TelemetryService()
