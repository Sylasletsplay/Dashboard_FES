# Backend Architecture

Das Backend fungiert als Vermittler zwischen den externen Datenquellen (Wetter, Pegel) und den Frontend-Clients.

## Technologie-Stack
- **Python 3.10+**
- **FastAPI:** Fr die Bereitstellung des Webservers und (optionaler) REST-Routen.
- **Uvicorn:** ASGI-Server zum Ausfhren der FastAPI-App.
- **WebSockets:** Fr bi-direktionale, echtzeitfhige Kommunikation.

## Komponenten
1. **`main.py`:** Einstiegspunkt. Definiert den FastAPI-Server, den WebSocket-Endpunkt (`/ws`) und empfngt Events vom Frontend (z.B. `CHANGE_CITY`).
2. **`telemetry_service.py`:** Ein asynchroner Hintergrund-Service.
   - Lufts in einer Endlosschleife (`_polling_loop`).
   - Ruft alle 5 Minuten externe APIs ab.
   - Bereitet die Daten auf und pusht sie via WebSocket an alle verbundenen Clients (Server-Sent-Events / Push-Architektur).
3. **`state_manager.py`:** Hlt den internen Zustand des Dashboards (welcher Ort, welche Gefahrenlage). Er sorgt dafr, dass neu verbindende Clients sofort den letzten bekannten Zustand ("Current State") erhalten, ohne auf den nchsten 5-Minuten-Poll warten zu mssen.

## Vermeidung von API-Rate-Limits
Anstatt dass jedes geffnete Dashboard-Tab selbst Wetter-APIs abfragt, macht dies ausschlielich das Python-Backend. Alle Frontend-Clients erhalten dieselben vorbereiteten JSON-Pakete. Das schont externe Ressourcen und verhindert Sperrungen (IP-Bans).
