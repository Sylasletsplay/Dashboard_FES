# Used APIs

Das Dashboard aggregiert Daten aus mehreren unabhngigen, hochverfgbaren und kostenfreien REST-APIs. 

## 1. Pegelonline (WSV - Wasserstraen- und Schifffahrtsverwaltung des Bundes)
Die offizielle API des Bundes fr Binnenwasserstraen.
- **Stations-Umkreissuche:** `https://pegelonline.wsv.de/webservices/rest-api/v2/stations.json?latitude={lat}&longitude={lon}&radius=30`
  - Findet alle Messstellen im Umkreis von 30km. Liefert die UUID der Stationen.
- **Historische Messwerte (24h):** `https://pegelonline.wsv.de/webservices/rest-api/v2/stations/{uuid}/W/measurements.json?start=P1D`
  - Liefert die Wasserstnde der letzten 24 Stunden. Daraus generiert das Backend die Tendenzen (Delta 1h) und das Frontend die Trend-Graphen.

## 2. Open-Meteo Geocoding API (nicht mehr im Einsatz)
Die Geocoding-API übersetzt Städtenamen in Koordinaten. Das Dashboard nutzt sie derzeit **nicht**: Der Standort (Berlin) ist fest hinterlegt. Die Dokumentation bleibt zur Referenz, falls künftig mehrere Standorte unterstützt werden sollen.
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=de`
- **Zweck:** Notwendig, da Pegelonline und Wetter-APIs längengrad-/breitengrad-basiert arbeiten.

## 3. Bright Sky (DWD-Wetterdaten)
Kostenlose JSON-API für die offenen Daten des Deutschen Wetterdienstes (DWD): Messwerte der SYNOP-Stationen und MOSMIX-Stationsvorhersagen (ca. 10 Tage). Kein API-Key, kein IP-basiertes Tageslimit - ersetzt Open-Meteo, dessen Limit (10.000 Aufrufe/Tag pro IP) auf der geteilten IP des Hosters regelmäßig von anderen Kunden aufgebraucht wurde.
- **Aktuelles Wetter:** `https://api.brightsky.dev/current_weather?lat={lat}&lon={lon}&tz=Europe/Berlin`
  - Temperatur, Wind (`wind_speed_10`), Böen (`wind_gust_speed_10`), Windrichtung, Niederschlag der letzten Stunde (`precipitation_60`), Luftdruck (`pressure_msl`, auf Meereshöhe), `condition`.
- **Stündliche Vorhersage:** `https://api.brightsky.dev/weather?lat={lat}&lon={lon}&date={heute}&last_date={heute+8}&tz=Europe/Berlin`
  - Liefert die nächsten 24 Stunden und wird im Backend zu Tageswerten für die 7-Tage-Vorhersage aggregiert (Min/Max-Temperatur, Niederschlagssumme, max. Regenwahrscheinlichkeit, max. Wind/Böen, schwerstes Tages-Wettersymbol 06-21 Uhr).
- **Amtliche Warnungen:** `https://api.brightsky.dev/alerts?lat={lat}&lon={lon}&tz=Europe/Berlin`
  - Aktive DWD-Wetterwarnungen für die Warnzelle des Standorts. `severity` wird auf die DWD-Warnstufen abgebildet (`minor`=1 gelb, `moderate`=2 orange, `severe`=3 rot, `extreme`=4 violett); angezeigt wird die schwerste aktive Warnung. Schlägt nur dieser Abruf fehl, zeigt das Dashboard "nicht abrufbar" statt "keine Warnung".
- **Besonderheiten:** Werte können `null` sein (wenn eine Station/Vorhersage sie nicht liefert); das Backend setzt dann 0 ein. Einen UV-Index liefert der DWD hier nicht - das Frontend zeigt `-`.
- **Lizenz:** Datenbasis: Deutscher Wetterdienst (DWD Open Data, CC BY 4.0).
