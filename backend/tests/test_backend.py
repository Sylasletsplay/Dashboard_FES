import asyncio
import io
import os
import sys
import urllib.request
from datetime import datetime, timedelta

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

import main
from services import telemetry_service as ts
from services.telemetry_service import _pegel_trend_map


@pytest.fixture
def fake_urlopen(monkeypatch):
    """Replace all outgoing HTTP calls."""
    class Fake:
        calls = []

        def __call__(self, req, **kwargs):
            self.calls.append(req.full_url)
            return io.BytesIO(b"[]" if "pegelonline" in req.full_url else b"{}")

    fake = Fake()
    monkeypatch.setattr(urllib.request, "urlopen", fake)
    return fake


@pytest.fixture
def service(fake_urlopen):
    svc = ts.TelemetryService()
    return svc


@pytest.fixture
def client(fake_urlopen, monkeypatch):
    # No background polling during tests; start each test with fresh cooldowns
    async def no_polling():
        pass
    monkeypatch.setattr(main.telemetry_service, "start_polling_loop", no_polling)
    for attr in ["_last_forecast_fetch", "_last_pegel_fetch", "_last_fire_fetch"]:
        monkeypatch.setattr(main.telemetry_service, attr, 0)
    with TestClient(main.app) as c:
        yield c


def refresh(ws, widget):
    ws.send_json({"type": "REFRESH_TELEMETRY", "data": {"widget": widget}})
    while True:
        msg = ws.receive_json()
        if msg["type"] == "REFRESH_RESULT":
            return msg["data"]


# ----------------- Water level trend -----------------
def test_trend_map_rising_and_flat():
    rising = _pegel_trend_map([100 + i for i in range(96)])  # +1 cm per 15 min
    assert rising["1"] == "+4.0 cm"
    assert rising["3"] == "+12.0 cm"
    flat = _pegel_trend_map([200] * 96)
    assert all(v == "0.0 cm" for v in flat.values())


def test_trend_map_too_little_data():
    assert _pegel_trend_map([5])["1"] == "0 cm"


# ----------------- Cooldowns -----------------
def test_auto_fetch_respects_cooldown(service, fake_urlopen):
    before = len(fake_urlopen.calls)
    assert asyncio.run(service.fetch_forecast_live()) == "ok"
    assert asyncio.run(service.fetch_forecast_live()) == "skipped"
    assert len(fake_urlopen.calls) - before == 3  # current_weather + weather + alerts


def test_manual_refresh_min_gap(service):
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "ok"
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "skipped"
    service._last_forecast_fetch -= ts.MANUAL_REFRESH_MIN_GAP + 1
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "ok"


# ----------------- Bright Sky parsing -----------------
def test_forecast_parses_brightsky(service, monkeypatch):
    now = datetime.now(ts.BERLIN_TZ).replace(minute=0, second=0, microsecond=0)
    hourly = []
    for h in range(9 * 24):
        dt = now + timedelta(hours=h)
        hourly.append({
            "timestamp": dt.isoformat(),
            "temperature": 10 + (h % 24) / 2,
            "precipitation": 1.0 if dt.hour == 12 else 0.0,
            "wind_speed": 20,
            "wind_gust_speed": 50 if dt.hour == 15 else None,
            "precipitation_probability": 45 if dt.hour == 12 else None,
            "condition": "rain" if dt.hour == 12 else "dry",
            "icon": "rain" if dt.hour == 12 else "partly-cloudy-day",
        })
    responses = {
        "/current_weather": {"weather": {
            "temperature": 12.34, "wind_speed_10": 18.0, "wind_gust_speed_10": 70.0,
            "wind_direction_10": 270, "precipitation_60": None, "pressure_msl": 1009.2,
            "condition": "dry", "icon": "cloudy",
        }},
        "/weather?": {"weather": hourly},
        "/alerts": {"alerts": [
            {"severity": "minor", "event_de": "WINDBÖEN", "headline_de": "Amtliche WARNUNG vor WINDBÖEN",
             "onset": (now - timedelta(hours=1)).isoformat(), "expires": (now + timedelta(hours=5)).isoformat()},
            {"severity": "severe", "event_de": "ORKANBÖEN", "headline_de": "Amtliche UNWETTERWARNUNG vor ORKANBÖEN",
             "onset": (now - timedelta(hours=1)).isoformat(), "expires": None},
            {"severity": "extreme", "event_de": "EXPIRED", "headline_de": "abgelaufen",
             "onset": (now - timedelta(hours=5)).isoformat(), "expires": (now - timedelta(hours=1)).isoformat()},
            {"severity": "extreme", "event_de": "FUTURE", "headline_de": "später",
             "onset": (now + timedelta(hours=5)).isoformat(), "expires": None},
        ]},
    }

    async def fake_get_json(url, timeout=5):
        return next(v for k, v in responses.items() if k in url)
    monkeypatch.setattr(service, "_get_json", fake_get_json)

    assert asyncio.run(service.fetch_forecast_live()) == "ok"
    w = service.data["weather"]
    assert w["temperature_c"] == 12.3
    assert w["wind_direction"] == "W"
    assert w["precipitation_mm"] == 0
    assert w["air_pressure_hpa"] == 1009.2
    # Official DWD warnings: only currently active ones count, most severe first
    assert w["warning_level"] == 3
    assert w["warning_text"] == "Amtliche UNWETTERWARNUNG vor ORKANBÖEN (+1 weitere)"
    assert w["warnings_available"] is True
    assert [a["event"] for a in w["warnings"]] == ["ORKANBÖEN", "WINDBÖEN"]

    assert len(service.data["forecast_24h"]) == 25
    assert service.data["forecast_24h"][0]["time"] == now.strftime("%H:%M")

    days = service.data["forecast_7days"]
    assert len(days) == 7
    assert days[0]["weekday"] == "Morgen"
    assert days[0]["condition"] == "Regen"
    assert days[0]["precipitation_sum"] == 1.0
    assert days[0]["precipitation_prob"] == 45
    assert days[0]["wind_gusts_kmh"] == 50
    assert days[0]["warning_risk"] == "Erhöht"
    assert "uv_index" not in days[0]


def test_warnings_feed_failure_is_not_reported_as_no_warning(service, monkeypatch):
    async def fake_get_json(url, timeout=5):
        if "/alerts" in url:
            raise OSError("timeout")
        return {"weather": {"temperature": 5} if "/current_weather" in url else []}
    monkeypatch.setattr(service, "_get_json", fake_get_json)

    assert asyncio.run(service.fetch_forecast_live()) == "ok"
    w = service.data["weather"]
    assert w["temperature_c"] == 5
    assert w["warnings_available"] is False
    assert w["warning_text"] == "DWD-Warnungen derzeit nicht abrufbar."


def test_no_active_warnings():
    out = ts._official_warnings([], datetime.now(ts.BERLIN_TZ))
    assert out["warning_level"] == 0
    assert out["warning_text"] == "Keine amtlichen Wetterwarnungen des DWD."


# ----------------- WebSocket -----------------
def test_ws_initial_state_has_telemetry(client):
    with client.websocket_connect("/ws") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "INITIAL_STATE"
        assert "water_levels" in msg["live_telemetry"]


def test_ws_refresh_reports_result(client):
    with client.websocket_connect("/ws") as ws:
        ws.receive_json()
        assert refresh(ws, "weather") == {"widget": "weather", "status": "ok", "retry_in": 0}
        second = refresh(ws, "weather")
        assert second["status"] == "skipped"
        assert 0 < second["retry_in"] <= ts.MANUAL_REFRESH_MIN_GAP


def test_ws_ignores_unknown_messages(client):
    with client.websocket_connect("/ws") as ws:
        ws.receive_json()
        for msg_type in ["RESET_STATE", "UPDATE_ALARM_LEVEL", "ADD_INCIDENT", "ping"]:
            ws.send_json({"type": msg_type, "data": {}})
        # Connection still works and nothing was answered for the ignored messages
        assert refresh(ws, "fire")["status"] == "ok"


# ----------------- REST -----------------
def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.parametrize("method,path", [
    ("POST", "/api/reset"),
    ("POST", "/api/alarm-level"),
    ("POST", "/api/units"),
    ("DELETE", "/api/units/u-1"),
    ("PATCH", "/api/incidents/E-1"),
])
def test_no_write_endpoints(client, method, path):
    assert client.request(method, path, json={}).status_code in (404, 405)


def test_static_route_blocks_path_traversal(client):
    if not os.path.exists(main.FRONTEND_DIST):
        pytest.skip("frontend/dist not built")
    for path in ["/..%2f..%2fbackend%2fmain.py", "/%2e%2e/%2e%2e/backend/main.py"]:
        r = client.get(path)
        assert "import asyncio" not in r.text
