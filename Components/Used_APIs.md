# Used APIs

Das Dashboard aggregiert Daten aus mehreren unabhngigen, hochverfgbaren und kostenfreien REST-APIs. 

## 1. Pegelonline (WSV - Wasserstraen- und Schifffahrtsverwaltung des Bundes)
Die offizielle API des Bundes fr Binnenwasserstraen.
- **Stations-Umkreissuche:** `https://pegelonline.wsv.de/webservices/rest-api/v2/stations.json?latitude={lat}&longitude={lon}&radius=30`
  - Findet alle Messstellen im Umkreis von 30km. Liefert die UUID der Stationen.
- **Historische Messwerte (24h):** `https://pegelonline.wsv.de/webservices/rest-api/v2/stations/{uuid}/W/measurements.json?start=P1D`
  - Liefert die Wasserstnde der letzten 24 Stunden. Daraus generiert das Backend die Tendenzen (Delta 1h) und das Frontend die Trend-Graphen.

## 2. Open-Meteo Geocoding API
Kostenlose Geocoding-API, die Stdteteinamen in Koordinaten bersetzt.
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=de`
- **Zweck:** Notwendig, da Pegelonline und Wetter-APIs lngengrad-/Breitengrad-basiert arbeiten.

## 3. Open-Meteo DWD-ICON API
Spezialisierte Wetter-API, die direkt auf die rohen, hochauflsenden ICON-D2 Modell-Daten des Deutschen Wetterdienstes (DWD) zugreift.
- **Endpoint:** `https://api.open-meteo.com/v1/dwd-icon?latitude={lat}&longitude={lon}&hourly=...&daily=...&current=...&timezone=Europe/Berlin`
- **Abgefragte Parameter:**
  - `current`: Temperatur, Luftdruck, Windgeschwindigkeit, Ben, Wetter-Code.
  - `daily`: Maximale/Minimale Temperatur, Niederschlagsdauer (`precipitation_hours`), maximaler Grundwind (`windspeed_10m_max`), maximale Ben (`windgusts_10m_max`).
- **Besonderheiten:** DWD-ICON-Daten knnen gelegentlich `null` enthalten (wenn das Modell an Rndern ungnau ist). Das Backend nutzt einen `safe_get`-Wrapper, um Abstrze zu verhindern und 0.0 als Fallback einzusetzen.
