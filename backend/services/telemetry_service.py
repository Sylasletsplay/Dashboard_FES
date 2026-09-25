import asyncio
import time
import json
import ssl
import urllib.request
import urllib.parse
import csv
from datetime import datetime
from typing import Any, Dict, List

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
        
        self.forecast_cooldown = 900
        self.pegel_cooldown = 0
        self.fire_cooldown = 0
        self._last_forecast_fetch = 0
        self._last_pegel_fetch = 0
        self._last_fire_fetch = 0
        
        # Initial cached telemetry state
        self.data: Dict[str, Any] = {
            "current_city": self.current_city,
            "last_updated": datetime.now().isoformat(),
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

    def _code_to_condition(self, code: int) -> str:
        if code in [1, 2, 3]:
            return "Teils bewölkt"
        elif code in [45, 48]:
            return "Nebel"
        elif code in [51, 53, 55, 61, 63, 65]:
            return "Regen"
        elif code in [71, 73, 75]:
            return "Schneefall"
        elif code in [80, 81, 82]:
            return "Schauer"
        elif code in [95, 96, 99]:
            return "Gewitter"
        return "Sonnig"

    async def fetch_forecast_live(self, force=False):
        """Fetches live 7-day forecast and 24h hourly forecast based on German DWD-ICON open model."""
        now = time.time()
        if not force and (now - self._last_forecast_fetch) < self.forecast_cooldown:
            return
        self._last_forecast_fetch = now
        try:
            url = f"https://api.open-meteo.com/v1/dwd-icon?latitude={self.lat}&longitude={self.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windgusts_10m_max,precipitation_sum,snowfall_sum,uv_index_max,winddirection_10m_dominant,sunshine_duration,precipitation_hours,windspeed_10m_max&timezone=Europe%2FBerlin&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,precipitation,weather_code&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m&forecast_hours=25"
            req = urllib.request.Request(url, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
            loop = asyncio.get_running_loop()
            res_bytes = await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(req, context=self.ssl_ctx, timeout=4).read()
            )
            raw = json.loads(res_bytes.decode("utf-8"))
            daily = raw.get("daily", {})
            times = daily.get("time", [])

            def get_wind_dir(deg: float) -> str:
                if deg is None: return "--"
                dirs = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
                val = int((deg / 22.5) + .5)
                return dirs[(val % 16)]

            # Update current weather
            current = raw.get("current", {})
            if current:
                cur_code = current.get("weather_code", 0)
                cur_gusts = current.get("wind_gusts_10m", 0)
                cur_precip = current.get("precipitation", 0)
                
                risk_level = 0
                risk_text = "Keine Warnung"
                if cur_gusts > 65 or cur_code >= 95 or cur_precip > 25:
                    risk_level = 3
                    risk_text = "Akute Unwettergefahr"
                elif cur_gusts > 45 or cur_precip > 10:
                    risk_level = 1
                    risk_text = "Erhöhte Gefahr"
                
                self.data["weather"] = {
                    "temperature_c": round(current.get("temperature_2m", 0), 1),
                    "wind_speed_kmh": round(current.get("wind_speed_10m", 0), 1),
                    "wind_gusts_kmh": round(cur_gusts, 1),
                    "wind_direction": get_wind_dir(current.get("wind_direction_10m")),
                    "precipitation_mm": round(cur_precip, 1),
                    "air_pressure_hpa": round(current.get("surface_pressure", 1013), 1),
                    "warning_level": risk_level,
                    "warning_text": risk_text
                }

            # Update 24h hourly forecast
            hourly = raw.get("hourly", {})
            h_times = hourly.get("time", [])
            forecast_24h = []
            if h_times:
                for i in range(len(h_times)):
                    dt_h = datetime.fromisoformat(h_times[i])
                    time_str = dt_h.strftime("%H:%M")
                    
                    forecast_24h.append({
                        "time": time_str,
                        "temperature_c": round(hourly.get("temperature_2m", [])[i], 1) if i < len(hourly.get("temperature_2m", [])) else 0,
                        "precipitation_mm": round(hourly.get("precipitation", [])[i], 1) if i < len(hourly.get("precipitation", [])) else 0,
                        "wind_speed_kmh": round(hourly.get("wind_speed_10m", [])[i], 1) if i < len(hourly.get("wind_speed_10m", [])) else 0,
                        "condition": self._code_to_condition(hourly.get("weather_code", [])[i] if i < len(hourly.get("weather_code", [])) else 0),
                        "weather_code": hourly.get("weather_code", [])[i] if i < len(hourly.get("weather_code", [])) else 0
                    })
            self.data["forecast_24h"] = forecast_24h

            if times:
                def safe_get(key: str, idx: int, default: float = 0.0) -> float:
                    arr = daily.get(key, [])
                    if not arr or idx >= len(arr):
                        return default
                    val = arr[idx]
                    return default if val is None else val

                forecast_list = []
                german_days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
                for i in range(min(7, len(times))):
                    date_str = times[i]
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                    weekday = "Heute" if i == 0 else german_days[dt.weekday()]
                    
                    code = int(safe_get("weathercode", i, 0))
                    t_min = round(safe_get("temperature_2m_min", i, 0), 1)
                    t_max = round(safe_get("temperature_2m_max", i, 0), 1)
                    rain_prob = safe_get("precipitation_probability_max", i, 0)
                    gusts = round(safe_get("windgusts_10m_max", i, 0), 1)
                    precip_sum = round(safe_get("precipitation_sum", i, 0), 1)
                    precip_hours = round(safe_get("precipitation_hours", i, 0), 1)
                    snow_sum = round(safe_get("snowfall_sum", i, 0), 1)
                    uv = round(safe_get("uv_index_max", i, 0), 1)
                    wind_dir = round(safe_get("winddirection_10m_dominant", i, 0), 0)
                    wind_speed = round(safe_get("windspeed_10m_max", i, 0), 1)
                    sun_duration_sec = safe_get("sunshine_duration", i, 0)
                    sun_hours = round(sun_duration_sec / 3600, 1) if sun_duration_sec else 0

                    condition = self._code_to_condition(code)

                    risk = "Normal"
                    if gusts > 65 or rain_prob > 70 or code >= 95 or precip_sum > 25:
                        risk = "Unwettergefahr"
                    elif gusts > 45 or rain_prob > 40 or precip_sum > 10:
                        risk = "Erhöht"
                    
                    forecast_list.append({
                        "date": date_str,
                        "weekday": weekday,
                        "temp_min": t_min,
                        "temp_max": t_max,
                        "precipitation_prob": rain_prob,
                        "precipitation_sum": precip_sum,
                        "precipitation_hours": precip_hours,
                        "snowfall_sum": snow_sum,
                        "wind_gusts_kmh": gusts,
                        "wind_speed_kmh": wind_speed,
                        "winddirection": get_wind_dir(wind_dir),
                        "sunshine_hours": sun_hours,
                        "uv_index": uv,
                        "weather_code": code,
                        "condition": condition,
                        "warning_risk": risk
                    })
                self.data["forecast_7days"] = forecast_list
        except Exception as e:
            if "weather" not in self.data:
                self.data["weather"] = {}
            self.data["weather"]["error"] = str(e)
            print(f"Error fetching DWD-ICON forecast: {e}")

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
        now = time.time()
        if not force and (now - self._last_pegel_fetch) < self.pegel_cooldown:
            return
        self._last_pegel_fetch = now
        try:
            await self._fetch_pegel_live_inner()
        except Exception as e:
            self.data["water_levels_error"] = str(e)
            print(f"Error fetching Pegel: {e}")

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
                    
                    # Calculate 1h delta. 1h ago is roughly 4 items back (15 min intervals)
                    idx_1h = max(0, len(items) - 5)
                    prev = items[idx_1h]["value"] if len(items) > 1 else latest
                    delta = round(latest - prev, 1)
                    trend = "steigend" if delta > 1 else ("fallend" if delta < -1 else "gleichbleibend")
                    
                    hw1 = station.get("hw1", 400)
                    hw2 = station.get("hw2", 500)
                    hw3 = station.get("hw3", 600)

                    danger = 0
                    if latest >= hw3:
                        danger = 3
                    elif latest >= hw2:
                        danger = 2
                    elif latest >= hw1:
                        danger = 1

                    if danger >= 2:
                        status_str = "ALARM"
                    elif danger == 1:
                        status_str = "ERHÖHT"
                    elif latest < (hw1 * 0.4):
                        status_str = "NIEDRIGWASSER"
                    else:
                        status_str = "NORMAL"

                    # Extract history for recharts
                    history = [{"time": item["timestamp"], "value": item["value"]} for item in items[::4]] # Keep every 4th point (1h)
                    
                    char_vals = station.get("char_vals", {})
                    
                    updated_list.append({
                        "station": f"{station.get('water', 'Gewässer')} / {station['name']}",
                        "level_cm": round(latest),
                        "trend": trend,
                        "delta_1h": f"{'+' if delta > 0 else ''}{delta} cm",
                        "danger_level": danger,
                        "max_normal": hw1,
                        "char_vals": char_vals,
                        "history": history
                    })
            except Exception as e:
                print(f"Error fetching Pegel {station['name']}: {e}")

        if updated_list:
            self.data["water_levels"] = updated_list

    async def fetch_fire_data_live(self, force=False):
        """Fetches the latest Berlin fire missions from the open data CSV."""
        now = time.time()
        if not force and (now - self._last_fire_fetch) < self.fire_cooldown:
            return
        self._last_fire_fetch = now
        try:
            url = "https://raw.githubusercontent.com/Berliner-Feuerwehr/BF-Open-Data/main/Datasets/Daily_Data/BFw_mission_data_daily.csv"
            req = urllib.request.Request(url, headers={"User-Agent": "KatS-Stab-Dashboard/1.0"})
            loop = asyncio.get_running_loop()
            res_bytes = await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(req, context=self.ssl_ctx, timeout=4).read()
            )
            
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
                    return
                
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
            self.data["fire_data_error"] = str(e)
            print(f"Error fetching fire data: {e}")

    async def start_polling_loop(self):
        """Periodic background poll for telemetry & forecast."""
        # dynamically fetch stations based on lat/lon
        await self.init_stations()
        
        # fetch everything once on start immediately
        await asyncio.gather(
            self.fetch_pegel_live(),
            self.fetch_forecast_live(),
            self.fetch_fire_data_live(),
            return_exceptions=True
        )

        while True:
            try:
                await asyncio.gather(
                    self.fetch_pegel_live(),
                    self.fetch_forecast_live(),
                    self.fetch_fire_data_live(),
                    return_exceptions=True
                )
                self.data["last_updated"] = datetime.now().isoformat()
                if self.broadcast_callback:
                    self.broadcast_callback("TELEMETRY_UPDATED", self.data)
            except Exception as e:
                print(f"Telemetry loop error: {e}")
            await asyncio.sleep(60)

    def set_city(self, city: str):
        pass

    def get_telemetry_data(self) -> Dict[str, Any]:
        return self.data

telemetry_service = TelemetryService()
