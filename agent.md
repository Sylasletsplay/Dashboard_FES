# Katastrophenschutz Modular S2/S3 Command Dashboard (DV 100)
## Architecture & Technical Plan (Map-Free & Telemetry-Focused)

A high-contrast, real-time command center dashboard for Katastrophenschutz command teams (Führungsstab / TEL / S2 Lage & S3 Einsatz nach DV 100).

The dashboard is designed as an **autonomous, viewport-locked, non-scrollable (100vh) single-screen display** powered by a dedicated Python FastAPI backend with real-time WebSockets, **comprehensive river & weather telemetry**, a **7-day DWD-ICON forecast carousel**, and a **compact current incidents panel (without a bulky map)**.

```
+-------------------------------------------------------------------------------------------------------------------------------+
| [Header] FÜHRUNGSSTAB KATASTROPHENSCHUTZ | STUFE: 0 (NORMALBETRIEB) | [🟢 LIVE VERBUNDEN (12ms)] | 14:32:10 CET | [Theme] [Full]|
+-----------------------------------------------------------------------------------------------+-------------------------------+
|  ECHTZEIT-TELEMETRIE & SENSORIK (9 COLS)                                                      |  WETTER DWD-ICON (3 COLS)     |
|                                                                                               |  [<]  Mo (Heute)   [>]        |
|  [Pegelonline WSV Wasserstände]       | [Wetter-Sensorik & DWD]                               |       Icon  17°C              |
|  - Donau / Passau: 485 cm (->)        | - Temp: 14.5°C | Wind 22km/h                          |             Leicht bewölkt    |
|  - Rhein / Köln: 244 cm (->)          | - Böen: 38 km/h | 1014 hPa                            |  [Klick für Details: Min/Max/Regen]|
|  - Elbe / Dresden: 182 cm (v)         | - Niederschlag: 0.2 mm/h                              +-------------------------------+
|  - Main / Würzburg: 195 cm (->)       | - DWD Warnstufe: 0 (Normal)                           |  AKTUELLE EINSÄTZE (3 COLS)   |
|  (inkl. optischer Schwellen-          |                                                       |                               |
|   fortschrittsbalken)                 | [KRITIS Versorgungsnetze]                             |  [!] Aktive Einsatzstellen (0)|
|                                       | - Stromnetz: 50.02 Hz (OK)                            |  - Prio 1-3 Badges            |
|                                       | - Trinkwasser: 4.8 bar OK                             |  - 1-Klick Fortschaltung      |
|                                       | - BOS Funk: 2/2 redundant                             |  - [Neuer Einsatz] Button     |
+---------------------------------------+-------------------------------------------------------+-------------------------------+
| [Footer Quickbar] [+ Neuer Einsatz] [+ Tagebucheintrag] [Einheit hinzufügen] [KatS-Stufe] [Widgets anpassen] [Zurücksetzen]   |
+-----------------------------------------------------------------------------------------------+-------------------------------+
```

---

## 1. Key Design Features

1. **Map-Free & Highly Legible Layout**:
   - The bulky map has been completely removed. Left side (9 columns) is dedicated entirely to critical telemetry. Right side (3 columns) houses a compact weather forecast and incidents tracker.
2. **Compact 7-Day Weather Carousel**:
   - A single-day scrollable forecast element providing a quick look at temperatures and conditions, expandable with a single click to view minimum temperatures, precipitation probability, and wind gusts.
3. **Comprehensive River & Infrastructure Telemetry**:
   - Live Pegelonline water levels (Donau, Rhein, Elbe, Main) with current cm, 1h trend arrows, and visual gauge bars.
   - Live DWD weather sensors (wind, gusts, temperature, precipitation, pressure).
   - KRITIS grid telemetry (power grid frequency 50Hz, municipal water pressure, BOS radio channels).
4. **Compact "Aktuelle Einsätze" Panel**:
   - Clean, focused queue for active emergency incidents with priority tags and 1-click status progression, taking minimal horizontal space.
5. **Fixed Modal & Contrast Bugs**:
   - Modals use `z-[9999]` and `select-text` for smooth, responsive interaction.
   - High-contrast styling in both Dark and Light modes.
6. **Strict 100vh Viewport Containment**:
   - Zero document scrolling.

---

## 2. Launch Instructions
```cmd
.\run.bat
```
*(Runs the Python backend and serves the compiled frontend at http://127.0.0.1:8000)*
