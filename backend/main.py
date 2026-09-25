import asyncio
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from state_manager import state_manager
from services.telemetry_service import telemetry_service

app = FastAPI(title="Katastrophenschutz Stabs-Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WebSocket Connection Manager -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop = None

    def set_loop(self, loop):
        self._loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial snapshot immediately upon connect
        initial_payload = {
            "type": "INITIAL_STATE",
            "data": state_manager.get_state(),
            "telemetry": state_manager.get_telemetry(),
            "live_telemetry": telemetry_service.get_telemetry_data()
        }
        await websocket.send_text(json.dumps(initial_payload))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, data: Any):
        payload = json.dumps({
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.append(connection)
        for d in disconnected:
            self.disconnect(d)

    def sync_broadcast(self, event_type: str, data: Any):
        if self._loop and self.active_connections:
            asyncio.run_coroutine_threadsafe(self.broadcast(event_type, data), self._loop)

ws_manager = ConnectionManager()

# Hook state_manager and telemetry_service broadcasts into WebSocket manager
state_manager.set_broadcast_callback(ws_manager.sync_broadcast)
telemetry_service.broadcast_callback = ws_manager.sync_broadcast

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()
    ws_manager.set_loop(loop)
    asyncio.create_task(telemetry_service.start_polling_loop())

# ----------------- WebSocket Endpoint -----------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            try:
                message = json.loads(text)
                msg_type = message.get("type")
                
                # Heartbeat Ping/Pong for latency tracking
                if msg_type == "ping":
                    pong_response = {
                        "type": "pong",
                        "client_time": message.get("client_time"),
                        "server_time": datetime.now().isoformat(),
                        "connected_clients": len(ws_manager.active_connections),
                        "total_events": state_manager.total_events
                    }
                    await websocket.send_text(json.dumps(pong_response))

                elif msg_type == "UPDATE_UNIT_STATUS":
                    payload = message.get("data", {})
                    state_manager.update_unit_status(
                        unit_id=payload.get("unit_id"),
                        status=payload.get("status"),
                        sector=payload.get("sector"),
                        location=payload.get("location")
                    )

                elif msg_type == "UPDATE_ALARM_LEVEL":
                    payload = message.get("data", {})
                    state_manager.update_alarm_level(
                        level=payload.get("level", 0),
                        title=payload.get("title")
                    )

                elif msg_type == "UPDATE_THREATS":
                    state_manager.update_threat_assessment(message.get("data", {}))

                elif msg_type == "ADD_INCIDENT":
                    state_manager.add_incident(message.get("data", {}))

                elif msg_type == "UPDATE_INCIDENT":
                    payload = message.get("data", {})
                    state_manager.update_incident(payload.get("id"), payload.get("updates", {}))

                elif msg_type == "ADD_ETB_ENTRY":
                    state_manager.add_etb_entry(message.get("data", {}))

                elif msg_type == "RESET_STATE":
                    state_manager.reset_state()

                elif msg_type == "CHANGE_CITY":
                    payload = message.get("data", {})
                    telemetry_service.set_city(payload.get("city", "Passau"))

                elif msg_type == "CUSTOM_WIDGET_DATA":
                    payload = message.get("data", {})
                    state_manager.set_custom_widget_data(payload.get("widget_id"), payload.get("data"))

            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# ----------------- Pydantic Models for REST -----------------
class AlarmLevelRequest(BaseModel):
    level: int
    title: Optional[str] = None

class ThreatAssessmentRequest(BaseModel):
    hochwasser: Optional[str] = None
    unwetter: Optional[str] = None
    kritis: Optional[str] = None
    notes: Optional[str] = None

class UnitStatusRequest(BaseModel):
    status: int
    sector: Optional[str] = None
    location: Optional[List[float]] = None

class NewUnitRequest(BaseModel):
    callsign: str
    name: str
    org: str
    status: Optional[int] = 2
    strength: Optional[str] = "0/0/0/0"
    sector: Optional[str] = "Bereitstellung"
    location: Optional[List[float]] = None

class NewIncidentRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[int] = 2
    sector: Optional[str] = "EA 1"
    status: Optional[str] = "Gemeldet"
    assigned_units: Optional[List[str]] = []
    location: Optional[List[float]] = None

class ETBEntryRequest(BaseModel):
    sender: str
    recipient: str
    content: str
    action: Optional[str] = ""

# ----------------- REST Endpoints -----------------
@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "Katastrophenschutz Dashboard Backend",
        "live_connections": len(ws_manager.active_connections),
        "telemetry": state_manager.get_telemetry()
    }

@app.get("/api/overview")
def get_overview():
    return state_manager.get_state()

@app.post("/api/alarm-level")
def set_alarm_level(req: AlarmLevelRequest):
    state_manager.update_alarm_level(req.level, req.title)
    return {"success": True, "level": req.level}

@app.post("/api/threats")
def update_threats(req: ThreatAssessmentRequest):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    state_manager.update_threat_assessment(data)
    return {"success": True, "data": data}

@app.get("/api/units")
def list_units():
    return state_manager.get_state().get("units", [])

@app.post("/api/units")
def create_unit(req: NewUnitRequest):
    unit = state_manager.add_unit(req.model_dump())
    return unit

@app.post("/api/units/{unit_id}/status")
def update_unit_status(unit_id: str, req: UnitStatusRequest):
    state_manager.update_unit_status(unit_id, req.status, req.sector, req.location)
    return {"success": True, "unit_id": unit_id, "status": req.status}

@app.delete("/api/units/{unit_id}")
def delete_unit(unit_id: str):
    state_manager.delete_unit(unit_id)
    return {"success": True, "deleted": unit_id}

@app.get("/api/incidents")
def list_incidents():
    return state_manager.get_state().get("incidents", [])

@app.post("/api/incidents")
def create_incident(req: NewIncidentRequest):
    inc = state_manager.add_incident(req.model_dump())
    return inc

@app.patch("/api/incidents/{incident_id}")
def patch_incident(incident_id: str, updates: Dict[str, Any]):
    res = state_manager.update_incident(incident_id, updates)
    if not res:
        raise HTTPException(status_code=404, detail="Incident not found")
    return res

@app.delete("/api/incidents/{incident_id}")
def delete_incident(incident_id: str):
    state_manager.delete_incident(incident_id)
    return {"success": True, "deleted": incident_id}

@app.get("/api/etb")
def list_etb():
    return state_manager.get_state().get("etb", [])

@app.post("/api/etb")
def create_etb_entry(req: ETBEntryRequest):
    entry = state_manager.add_etb_entry(req.model_dump())
    return entry

@app.post("/api/reset")
def reset_state():
    state_manager.reset_state()
    return {"success": True, "message": "State reset to clean default."}

@app.get("/api/telemetry")
def get_telemetry():
    return {
        "server": state_manager.get_telemetry(),
        "live": telemetry_service.get_telemetry_data()
    }

# ----------------- Static Frontend Mount (if built) -----------------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
