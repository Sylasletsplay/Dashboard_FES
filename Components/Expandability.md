# Expandability (Erweiterbarkeit)

Das Dashboard ist modular aufgebaut, damit neue Datenquellen und Widgets mit wenig Aufwand ergänzt werden können.

## Neues Widget im Frontend
1. Erstelle eine React-Komponente unter `src/widgets/MyNewWidget.tsx` und nutze `WidgetContainer` als Rahmen (einheitlicher Kopf mit Titel, Icon und optionalem `RefreshButton`).
2. Ergänze die benötigten Felder in `LiveTelemetry` (`src/types/dashboard.ts`), passend zu den Daten, die das Backend sendet.
3. Binde das Widget in `App.tsx` in das Spalten-Grid ein und übergib ihm `liveData`.

## Neue Datenquelle im Backend
1. Lege in `services/telemetry_service.py` eine `fetch_..._live(force=False)`-Methode nach dem Muster der bestehenden an (eigener Cooldown, 429-Backoff, Rückgabe `"ok"` / `"skipped"` / `"error"`).
2. Schreibe die Ergebnisse in `self.data` und rufe die Methode in `start_polling_loop` auf. Alle Clients erhalten die Daten dann automatisch über `TELEMETRY_UPDATED`.
3. Soll das Widget einen Aktualisieren-Knopf haben, trage den Feed in `main.py` im `REFRESH_TELEMETRY`-Handler ein und ergänze den Namen in `RefreshWidget` (`src/types/dashboard.ts`).

## Read-Only-Prinzip
Clients können den Server-Zustand nicht verändern. Über den WebSocket werden nur `ping` und `REFRESH_TELEMETRY` (pro Feed höchstens alle 30 s) verarbeitet; es gibt keine schreibenden REST-Endpunkte. Neue Funktionen sollten dieses Prinzip beibehalten.
