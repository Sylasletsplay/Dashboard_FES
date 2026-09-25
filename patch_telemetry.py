import os

telemetry_path = "C:/Users/Kempter/Documents/MiniDashboard/old/backend/services/telemetry_service.py"
main_path = "C:/Users/Kempter/Documents/MiniDashboard/old/backend/main.py"

with open(telemetry_path, 'r', encoding='utf-8') as f:
    t_content = f.read()

# Add time import
if "import time" not in t_content:
    t_content = t_content.replace("import asyncio\n", "import asyncio\nimport time\n")

# Add variables to __init__
init_old = "        self.stations = []"
init_new = """        self.stations = []
        
        self.forecast_cooldown = 900
        self.pegel_cooldown = 0
        self.fire_cooldown = 0
        self._last_forecast_fetch = 0
        self._last_pegel_fetch = 0
        self._last_fire_fetch = 0"""
if "self.forecast_cooldown" not in t_content:
    t_content = t_content.replace(init_old, init_new)

# Update fetch_forecast_live
forecast_sig_old = '''    async def fetch_forecast_live(self):
        """Fetches live 7-day forecast and 24h hourly forecast based on German DWD-ICON open model."""'''
forecast_sig_new = '''    async def fetch_forecast_live(self, force=False):
        """Fetches live 7-day forecast and 24h hourly forecast based on German DWD-ICON open model."""
        now = time.time()
        if not force and (now - self._last_forecast_fetch) < self.forecast_cooldown:
            return
        self._last_forecast_fetch = now'''
if "fetch_forecast_live(self, force=False)" not in t_content:
    t_content = t_content.replace(forecast_sig_old, forecast_sig_new)

# Catch exception in forecast
forecast_except_old = '''        except Exception as e:
            print(f"Error fetching DWD-ICON forecast: {e}")'''
forecast_except_new = '''        except Exception as e:
            if "weather" not in self.data:
                self.data["weather"] = {}
            self.data["weather"]["error"] = str(e)
            print(f"Error fetching DWD-ICON forecast: {e}")'''
t_content = t_content.replace(forecast_except_old, forecast_except_new)

# Update fetch_pegel_live by renaming to inner and creating a wrapper
pegel_sig_old = '''    async def fetch_pegel_live(self):
        """Asynchronously updates water levels from Pegelonline WSV API including history."""'''
pegel_sig_new = '''    async def fetch_pegel_live(self, force=False):
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

    async def _fetch_pegel_live_inner(self):'''
if "fetch_pegel_live(self, force=False)" not in t_content:
    t_content = t_content.replace(pegel_sig_old, pegel_sig_new)

# Update fetch_fire_data_live
fire_sig_old = '''    async def fetch_fire_data_live(self):
        """Fetches the latest Berlin fire missions from the open data CSV."""'''
fire_sig_new = '''    async def fetch_fire_data_live(self, force=False):
        """Fetches the latest Berlin fire missions from the open data CSV."""
        now = time.time()
        if not force and (now - self._last_fire_fetch) < self.fire_cooldown:
            return
        self._last_fire_fetch = now'''
if "fetch_fire_data_live(self, force=False)" not in t_content:
    t_content = t_content.replace(fire_sig_old, fire_sig_new)

# Catch exception in fire
fire_except_old = '''        except Exception as e:
            print(f"Error fetching fire data: {e}")'''
fire_except_new = '''        except Exception as e:
            self.data["fire_data_error"] = str(e)
            print(f"Error fetching fire data: {e}")'''
t_content = t_content.replace(fire_except_old, fire_except_new)

with open(telemetry_path, 'w', encoding='utf-8') as f:
    f.write(t_content)

print("Patched telemetry_service.py")

# Update main.py
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

# Add REFRESH_TELEMETRY to websocket_endpoint loop
ws_refresh_code = """                elif msg_type == "CUSTOM_WIDGET_DATA":
                    payload = message.get("data", {})
                    state_manager.set_custom_widget_data(payload.get("widget_id"), payload.get("data"))

                elif msg_type == "REFRESH_TELEMETRY":
                    payload = message.get("data", {})
                    widget = payload.get("widget")
                    if widget == "weather":
                        await telemetry_service.fetch_forecast_live(force=True)
                    elif widget == "pegel":
                        await telemetry_service.fetch_pegel_live(force=True)
                    elif widget == "fire":
                        await telemetry_service.fetch_fire_data_live(force=True)
                    
                    # Broadcast updated telemetry immediately
                    ws_manager.sync_broadcast("TELEMETRY_UPDATED", telemetry_service.get_telemetry_data())
"""
m_content = m_content.replace("""                elif msg_type == "CUSTOM_WIDGET_DATA":
                    payload = message.get("data", {})
                    state_manager.set_custom_widget_data(payload.get("widget_id"), payload.get("data"))""", ws_refresh_code)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)

print("Patched main.py")
