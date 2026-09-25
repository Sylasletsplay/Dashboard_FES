import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from state_manager import StateManager
import tempfile

def test_initial_clean_state():
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        temp_path = tf.name
    
    try:
        sm = StateManager(state_file=temp_path)
        state = sm.get_state()
        assert state["alarm_level"] == 0
        assert "Normalbetrieb" in state["alarm_title"]
        assert len(state["incidents"]) == 0
        assert len(state["units"]) >= 5
        assert len(state["etb"]) >= 1
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_alarm_level_change():
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        temp_path = tf.name
    
    try:
        sm = StateManager(state_file=temp_path)
        sm.update_alarm_level(3)
        state = sm.get_state()
        assert state["alarm_level"] == 3
        assert "Katastrophenfall" in state["alarm_title"]
        # Confirm auto ETB entry
        latest_etb = state["etb"][-1]
        assert "Katastrophenfall" in latest_etb["content"]
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_unit_status_and_incident_workflow():
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        temp_path = tf.name
    
    try:
        sm = StateManager(state_file=temp_path)
        # Add incident
        inc = sm.add_incident({
            "title": "Hochwasser Deichsicherung",
            "priority": 1,
            "sector": "EA 1 Nord"
        })
        assert inc["id"].startswith("E-")
        assert len(sm.get_state()["incidents"]) == 1

        # Update unit status to 4 (Am Einsatzort)
        sm.update_unit_status("u-1", 4, sector="EA 1 Nord")
        unit = next(u for u in sm.get_state()["units"] if u["id"] == "u-1")
        assert unit["status"] == 4
        assert unit["sector"] == "EA 1 Nord"

        # Update threat assessment
        sm.update_threat_assessment({"hochwasser": "Pegel Passau 840cm, steigend"})
        threats = sm.get_state()["threat_assessment"]
        assert "840cm" in threats["hochwasser"]
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
