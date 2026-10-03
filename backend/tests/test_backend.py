import asyncio
import io
import os
import sys
import urllib.error
import urllib.request

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

import main
from services import telemetry_service as ts
from services.telemetry_service import _pegel_trend_map


@pytest.fixture
def fake_urlopen(monkeypatch):
    """Replace all outgoing HTTP calls. Set `.status` to 429 to simulate rate limiting."""
    class Fake:
        status = 200
        calls = []

        def __call__(self, req, **kwargs):
            self.calls.append(req.full_url)
            if self.status == 429:
                raise urllib.error.HTTPError(
                    req.full_url, 429, "Too Many Requests", {},
                    io.BytesIO(b'{"reason":"Daily API request limit exceeded."}'))
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


# ----------------- Cooldowns & rate limiting -----------------
def test_auto_fetch_respects_cooldown(service, fake_urlopen):
    assert asyncio.run(service.fetch_forecast_live()) == "ok"
    assert asyncio.run(service.fetch_forecast_live()) == "skipped"
    assert len(fake_urlopen.calls) == 1


def test_429_backs_off_and_success_restores(service, fake_urlopen):
    fake_urlopen.status = 429
    assert asyncio.run(service.fetch_forecast_live()) == "error"
    assert service.forecast_cooldown == ts.RATE_LIMIT_BACKOFF

    fake_urlopen.status = 200
    service._last_forecast_fetch -= ts.MANUAL_REFRESH_MIN_GAP + 1
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "ok"
    assert service.forecast_cooldown == ts.FORECAST_COOLDOWN


def test_manual_refresh_min_gap(service):
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "ok"
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "skipped"
    service._last_forecast_fetch -= ts.MANUAL_REFRESH_MIN_GAP + 1
    assert asyncio.run(service.fetch_forecast_live(force=True)) == "ok"


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
