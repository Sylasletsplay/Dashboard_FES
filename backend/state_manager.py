import json
import os
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

STATE_FILE = os.path.join(os.path.dirname(__file__), "data", "kats_state.json")

class StateManager:
    def __init__(self, state_file: str = STATE_FILE):
        self.state_file = state_file
        self.lock = threading.Lock()
        self.total_events = 0
        self.start_time = datetime.now()
        self._ws_broadcast_callback = None
        self._custom_widget_store: Dict[str, Any] = {}
        self.load_state()

    def set_broadcast_callback(self, callback):
        self._ws_broadcast_callback = callback

    def load_state(self):
        with self.lock:
            if os.path.exists(self.state_file):
                try:
                    with open(self.state_file, "r", encoding="utf-8") as f:
                        self.state = json.load(f)
                except Exception:
                    self.state = self._default_state()
            else:
                self.state = self._default_state()
                self._save_unlocked()

    def _default_state(self) -> Dict[str, Any]:
        return {
            "alarm_level": 0,
            "alarm_title": "Stufe 0 - Normalbetrieb",
            "threat_assessment": {
                "hochwasser": "Keine Daten – Pegelstände siehe Telemetrie",
                "unwetter": "Keine Daten – Wetterlage siehe Telemetrie",
                "kritis": "Keine Daten verfügbar",
                "notes": "Keine Meldungen."
            },
            "incidents": [],
            "units": [],
            "etb": []
        }

    def _save_unlocked(self):
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        with open(self.state_file, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def _notify(self, event_type: str, data: Any):
        self.total_events += 1
        if self._ws_broadcast_callback:
            try:
                self._ws_broadcast_callback(event_type, data)
            except Exception as e:
                print(f"Error in broadcast callback: {e}")

    def get_state(self) -> Dict[str, Any]:
        with self.lock:
            state_copy = json.loads(json.dumps(self.state))
            state_copy["custom_widgets"] = self._custom_widget_store
            return state_copy

    def update_alarm_level(self, level: int, title: Optional[str] = None):
        titles = {
            0: "Stufe 0 - Normalbetrieb",
            1: "Stufe 1 - Vorwarnung / Bereitstellung",
            2: "Stufe 2 - Katastrophenvoralarm",
            3: "Stufe 3 - Katastrophenfall (Kat-Fall)"
        }
        with self.lock:
            self.state["alarm_level"] = level
            self.state["alarm_title"] = title or titles.get(level, f"Stufe {level}")
            self._save_unlocked()
            
            # Auto add ETB entry
            etb_entry = {
                "id": len(self.state["etb"]) + 1,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "sender": "KatS-Leitung",
                "recipient": "Alle Einheiten / Stabsbereiche",
                "content": f"Alarmstufe geändert auf: {self.state['alarm_title']}",
                "action": "Maßnahmen gemäß Alarmplan einleiten." if level > 0 else "Regulärer Standby-Betrieb."
            }
            self.state["etb"].append(etb_entry)
            self._save_unlocked()

        self._notify("ALARM_LEVEL_CHANGED", {
            "alarm_level": self.state["alarm_level"],
            "alarm_title": self.state["alarm_title"],
            "etb_entry": etb_entry
        })

    def update_threat_assessment(self, data: Dict[str, Any]):
        with self.lock:
            self.state["threat_assessment"].update(data)
            self._save_unlocked()
        self._notify("THREATS_UPDATED", self.state["threat_assessment"])

    def update_unit_status(self, unit_id: str, status: int, sector: Optional[str] = None, location: Optional[List[float]] = None):
        updated_unit = None
        with self.lock:
            for u in self.state["units"]:
                if u["id"] == unit_id:
                    old_status = u["status"]
                    u["status"] = status
                    if sector:
                        u["sector"] = sector
                    if location:
                        u["location"] = location
                    updated_unit = dict(u)
                    
                    # Auto ETB entry on significant change
                    etb_entry = {
                        "id": len(self.state["etb"]) + 1,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "sender": u["callsign"],
                        "recipient": "S3 Einsatz",
                        "content": f"FMS Statuswechsel: {u['callsign']} von Status {old_status} auf Status {status}",
                        "action": f"Status im System vermerkt."
                    }
                    self.state["etb"].append(etb_entry)
                    break
            self._save_unlocked()

        if updated_unit:
            self._notify("UNIT_UPDATED", {"unit": updated_unit, "etb_entry": etb_entry})

    def add_unit(self, unit_data: Dict[str, Any]):
        with self.lock:
            if not unit_data.get("id"):
                unit_data["id"] = f"u-{int(datetime.now().timestamp()*1000)}"
            if "status" not in unit_data:
                unit_data["status"] = 2
            if "strength" not in unit_data:
                unit_data["strength"] = "0/0/0/0"
            if "location" not in unit_data or not unit_data["location"]:
                unit_data["location"] = [48.57, 13.46]
            self.state["units"].append(unit_data)
            self._save_unlocked()

        self._notify("UNIT_ADDED", unit_data)
        return unit_data

    def delete_unit(self, unit_id: str):
        with self.lock:
            self.state["units"] = [u for u in self.state["units"] if u["id"] != unit_id]
            self._save_unlocked()
        self._notify("UNIT_DELETED", {"id": unit_id})

    def add_incident(self, incident_data: Dict[str, Any]):
        with self.lock:
            if not incident_data.get("id"):
                incident_data["id"] = f"E-{len(self.state['incidents']) + 1:03d}"
            incident_data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if "status" not in incident_data:
                incident_data["status"] = "Gemeldet"
            if "priority" not in incident_data:
                incident_data["priority"] = 2
            if "assigned_units" not in incident_data:
                incident_data["assigned_units"] = []
            if "location" not in incident_data or not incident_data["location"]:
                incident_data["location"] = [48.573, 13.46]

            self.state["incidents"].append(incident_data)
            
            # ETB entry
            etb_entry = {
                "id": len(self.state["etb"]) + 1,
                "timestamp": incident_data["created_at"],
                "sender": "Einsatzzentrale",
                "recipient": "Führungsstab",
                "content": f"Neuer Einsatz #{incident_data['id']}: {incident_data.get('title', 'Einsatzstelle')} (Prio {incident_data['priority']})",
                "action": f"Abschnitt: {incident_data.get('sector', 'Standard')} | Status: {incident_data['status']}"
            }
            self.state["etb"].append(etb_entry)
            self._save_unlocked()

        self._notify("INCIDENT_ADDED", {"incident": incident_data, "etb_entry": etb_entry})
        return incident_data

    def update_incident(self, incident_id: str, updates: Dict[str, Any]):
        updated = None
        with self.lock:
            for inc in self.state["incidents"]:
                if inc["id"] == incident_id:
                    inc.update(updates)
                    updated = dict(inc)
                    break
            self._save_unlocked()

        if updated:
            self._notify("INCIDENT_UPDATED", updated)
        return updated

    def delete_incident(self, incident_id: str):
        with self.lock:
            self.state["incidents"] = [i for i in self.state["incidents"] if i["id"] != incident_id]
            self._save_unlocked()
        self._notify("INCIDENT_DELETED", {"id": incident_id})

    def add_etb_entry(self, entry: Dict[str, Any]):
        with self.lock:
            entry["id"] = len(self.state["etb"]) + 1
            if "timestamp" not in entry or not entry["timestamp"]:
                entry["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self.state["etb"].append(entry)
            self._save_unlocked()

        self._notify("ETB_ADDED", entry)
        return entry

    def set_custom_widget_data(self, widget_id: str, data: Any):
        with self.lock:
            self._custom_widget_store[widget_id] = data
        self._notify("CUSTOM_WIDGET_UPDATED", {"widget_id": widget_id, "data": data})

    def reset_state(self):
        with self.lock:
            self.state = self._default_state()
            self._custom_widget_store.clear()
            self._save_unlocked()
        self._notify("STATE_RESET", self.get_state())

    def get_telemetry(self) -> Dict[str, Any]:
        uptime_seconds = int((datetime.now() - self.start_time).total_seconds())
        return {
            "uptime_seconds": uptime_seconds,
            "total_events": self.total_events,
            "server_time": datetime.now().isoformat(),
            "status": "LIVE_OPERATIONAL"
        }

state_manager = StateManager()
