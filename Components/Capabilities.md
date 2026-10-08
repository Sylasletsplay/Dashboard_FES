# Dashboard Capabilities

Das Dashboard ist als passives, ausfallsicheres Informationsdisplay (Read-Only) konzipiert. Es ist darauf ausgelegt, permanent in einem Leitstand oder Stabsraum auf einem groen Monitor (z.B. Smartboard) zu laufen.

## Hauptfunktionen

1. **Dynamische Ortswahl (City-Search):**
   - ber ein Suchfeld oben links kann eine beliebige deutsche Stadt eingegeben werden (z.B. "Dresden", "Passau", "Erftstadt").
   - Das Backend geocodiert den Ortsnamen in Koordinaten.

2. **Hyperlokale Fluss-Pegel (WSV):**
   - Anhand der Koordinaten sucht das Dashboard automatisch nach allen offiziellen Fluss-Pegel-Stationen in einem Umkreis von 30 Kilometern.
   - Es visualisiert die aktuellen Wasserstnde (in cm).
   - Ein historischer Graph (Recharts) zeigt den Verlauf der letzten 24 Stunden, um Tendenzen (steigend/fallend) sofort erkennbar zu machen.

3. **Präzises KatS-Wetter (DWD via Bright Sky):**
   - Das Dashboard ruft Messwerte und MOSMIX-Vorhersagen des Deutschen Wetterdienstes (DWD) über die kostenlose Bright Sky API ab.
   - Live-Sensorik: Aktuelle Windgeschwindigkeiten (inkl. Ben), Niederschlag (mm/h), Temperatur und Luftdruck.
   - Amtliche DWD-Warnungen: Die schwerste aktive Wetterwarnung des DWD für den Standort (Warnstufe 1-4) inkl. Gültigkeitsdauer.

4. **7-Tage Lagevorschau:**
   - Ein Widget auf der rechten Seite zeigt eine bersichtliche Vorhersage der kommenden Woche.
   - Fokus auf KatS-relevante Metriken: Temperatur-Extreme, Niederschlagsdauer (Stunden), Starkregenwahrscheinlichkeit und maximaler Grundwind.

5. **Read-Only Architektur:**
   - Gem den Anforderungen ("Sie mssen entscheiden, wie schlimm es ist") trifft das Dashboard keine Einsatzentscheidungen und simuliert keine Daten. Es bietet ausschlielich eine gebndelte visuelle Aufbereitung von Echtzeit-Rohdaten. Kein Anlegen von Einsatzen oder Einheiten mglich.
