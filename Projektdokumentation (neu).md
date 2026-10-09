# Projektdokumentation: KatS-Stab-Dashboard

Dieses Dokument erklärt, wie das Dashboard gestartet, bedient und gepflegt wird.
Es richtet sich an Personen, die das System betreiben – Vorwissen in Programmierung
ist für den **Normalbetrieb nicht erforderlich**.

Das Dashboard besteht aus zwei Teilen:

| Teil    | Aufgabe                                              | Port  |
|---------|------------------------------------------------------|-------|
| Backend | Holt die Fachdaten von den externen Quellen, stellt sie per Echtzeit-Verbindung zur Verfügung | 8000 |
| Frontend| Zeigt das Dashboard im Browser, empängt die Live-Daten | 5173 |

Beide Teile müssen gleichzeitig laufen. Die Anleitung unten startet sie automatisch.

---

## 1. Vorinstalliertes Dashboard (ohne Installation)

Das einfachste Verfahren: Es besteht kein Installationsbedarf. Das Dashboard ist
online verfügbar unter:

```
https://sylasletsplay.github.io/Dashboard_FES/
```

Die Seite kann beim ersten Aufruf ein wenig Zeit zum Laden brauchen, da sie auf einem
kostenlosen Dienst gehostet ist. Danach sind alle Funktionen direkt im Browser nutzbar.

> Diese Variante wird empfohlen, wenn das Dashboard nur **angezeigt** werden soll und
> keine Änderungen am System vorgenommen werden müssen.

---

## 2. Voraussetzungen (nur für den lokalen Betrieb)

Wer das Dashboard **lokal** starten möchte (z. B. für Weiterentwicklung oder zum
Anpassen), benötigt einmalig zwei Programme:

1. **Python** (Version 3.9 oder neuer)
   * Herunterladen unter `https://www.python.org/downloads/`
   * **Wichtig bei der Installation:** Im ersten Installationsfenster die Option
     „Add Python to PATH" (Python zum Umgebungsvariablenpfad hinzufügen)
     **aktiviert** lassen.
2. **Node.js** (Version 18 oder neuer, LTS empfohlen)
   * Herunterladen unter `https://nodejs.org/`
   * Standardinstallation reicht aus.

Beide Programme installieren die benötigte Laufzeitumgebung (bzw. den Paketverwalter
`npm`) automatisch mit.

---

## 3. Projekt einmalig beziehen

Das Projekt wird aus dem zentralen Code-Archiv (Git-Repository) auf den eigenen
Rechner geladen. Das funktioniert über die Eingabeaufforderung (Windows) bzw. das
Terminal (Mac/Linux).

### Windows (Eingabeaufforderung)
1. Die **Eingabeaufforderung** öffnen:
   * `Windows-Taste` drücken, `cmd` eingeben, `Enter` drücken.
2. Folgende Zeile einfügen und `Enter` drücken:

```
git clone https://github.com/Sylasletsplay/Dashboard_FES.git
cd Dashboard_FES
```

> Falls `git` nicht erkannt wird, ist Git nicht installiert. Es steht kostenlos
> unter `https://git-scm.com/downloads` zum Download bereit. Standardinstallation.

### Alternative: Zip-Download
Ohne Git kann das Projekt auch als Archiv heruntergeladen werden:
1. Im Browser öffnen: `https://github.com/Sylasletsplay/Dashboard_FES`
2. Grüner Button **Code** → **Download ZIP**.
3. Zip-Ordner entpacken.
4. Im nächsten Schritt in diesen entpackten Ordner wechseln (`cd`).

---

## 4. Dashboard starten

### 4.1 Einfache Variante: Start-Skript

Im Projektordner liegt die Datei `run.bat`. Sie führt alle nötigen Schritte selbstständig
durch und startet beide Teilsysteme.

**Windows:** Datei `run.bat` doppelklicken, oder in der Eingabeaufforderung:

```
run.bat
```

Danach öffnet sich das Dashboard automatisch im Standard-Webbrowser unter
`http://localhost:5173`.

> **Hinweis:** Manche Rechner (z. B. mit eingeschränkter Sicherheitskonfiguration oder
> einer "Smart-App"-Prüfung) blockieren `.bat`-Dateien. In diesem Fall bitte die
> manuelle Variante in Abschnitt 4.2 verwenden.

### 4.2 Manuelle Variante (ohne Skript)

Falls das Start-Skript nicht ausgeführt werden kann, werden dieselben Schritte von
Hand erledigt. Dafür werden **zwei** getrennte Terminals (Eingabeaufforderungen)
benötigt, da Backend und Frontend jeweils eigenständig laufen.

**Vorbereitung (einmalig):** In ein Terminal wechseln, das sich im Projektordner
befindet (siehe Abschnitt 3).

**Schritt 1 – Python-Umgebung für das Backend anlegen**

```
python -m venv backend\venv
```

**Schritt 2 – Diese Umgebung aktivieren und die Backend-Bibliotheken installieren**

```
backend\venv\Scripts\activate
pip install -r backend\requirements.txt
```

*(Mac/Linux: statt `backend\venv\Scripts\activate` die Zeile
`source backend/venv/bin/activate` verwenden.)*

**Schritt 3 – Frontend-Bibliotheken installieren**

```
cd frontend
npm install
```

**Schritt 4a – Backend starten (Terminal 1)**
Terminal auf den Projektordner stellen (ggf. `cd` zurück), und:

```
backend\venv\Scripts\python backend\main.py
```

Das Backend läuft jetzt unter Port 8000. In diesem Terminal nichts schließen.

**Schritt 4b – Frontend starten (Terminal 2)**
Ein **zweites** Terminal öffnen, ebenfalls im Projektordner:

```
cd frontend
npm run dev
```

**Schritt 5 – Im Browser öffnen**

```
http://localhost:5173
```

Das Frontend verbindet sich automatisch mit dem Backend. Sind beide Terminals aktiv,
ist das Dashboard betriebsbereit.

> **Beenden:** In beiden Terminals `Strg + C` drücken.

---

## 5. Bedienung des Dashboards

### 5.1 Aufbau
Das Dashboard zeigt drei Fachbereiche nebeneinander an:

* **Wasserstände** (links): Aktuelle Pegelstände der Berliner Messstellen mit
  Tendenz (steigend / fallend / gleichbleibend) und – aufklappbar – einem
  24-Stunden-Verlauf sowie Referenzwerten (NNW, MNW, MW, MHW, HHW). Suchen, Filtern
  und die Wahl des **Trend-Zeitraums** sind möglich.
* **Einsatzdaten der Feuerwehr** (mitte): Gesamtzahl der Einsätze des Vortags sowie
  ein farbiges Einsatzspektrum (Fläche = Anteil an Einsätzen).
* **Wetter** (rechts): Aktuelle Wetterwerte, eine stündliche Prognose für die nächsten
  24 Stunden und eine Prognose für die **kommenden sieben Tage** (ohne den heutigen
  Tag).

### 5.2 Live-Anzeige
Oben in der Kopfzeile steht der Zeitstempel des letzten Datenstands sowie der
Verbindungsstatus (**LIVE** / **OFFLINE**). Alle Änderungen werden ohne manuelles
Aktualisieren angezeigt.

### 5.3 Interaktion
* **Aufklappen:** Einen Tageintrag in der Prognose anklicken, um Details (Wind,
  UV-Index, Niederschlag, Warnrisiko) zu sehen. Ein zweites Klicken schließt ihn.
* **Stündliche Prognose:** Über die kleinen Pfeil-Buttons links und rechts lässt sich
  die Zeitleiste durchblättern.
* **Trend-Zeitraum (Wasserstände):** Über die Zeitleiste-Schalter (1 / 3 / 6 / 12 / 24 h)
  rechts neben dem Filter lässt sich festlegen, über welchen Zeitraum die Tendenz
  (steigend / fallend) berechnet wird. 1 h reagiert empfindlich, 3 h ist Standard und
  glättet die kurzen Schwankungen des Pegels; größere Zeiträume zeigen den
  Langfristverlauf. Die Auswahl wird gespeichert.
* **Heller/dunkler Modus:** Kleiner Schalter (Sonne/Mond) rechts in der Kopfzeile.
* **Manuelle Aktualisierung:** Jeder Fachbereich hat oben einen kleinen
  Aktualisierungspfeil, der die jeweilige Datenquelle gezielt neu lädt.
* **API-Budget-Anzeige:** Im Status-Widget wird der Verbrauch der Wetter-API
  (Open-Meteo) live ausgegeben – Kosten pro Abfrage, verbrauchtes Tageskontingent,
  verbleibende manuelle Aktualisierungen und die errechenbare Laufzeit.

### 5.4 Anzeige auf unterschiedlichen Bildschirmen
Das Dashboard skaliert sich automatisch an die Bildschirmgröße an. Auf großen
Wänden werden die Inhalte größer dargestellt, auf kleineren Bildschirmen entsprechend
kompakter – alle Bereiche bleiben dabei auf einer Seite sichtbar.

---

## 6. Datenquellen und Lizenzen

Die Fachdaten stammen von offiziellen öffentlichen Schnittstellen. Die Herkunft wird
direkt an der jeweiligen Anzeige kenntlich gemacht:

| Fachbereich   | Quelle                                   | Lizenz        |
|---------------|------------------------------------------|---------------|
| Wetter        | Open-Meteo.com (DWD-ICON-Modell)         | CC BY 4.0     |
| Einsatzdaten  | Berliner Feuerwehr, BF-Open-Data         | CC BY 4.0     |
| Pegelstände   | WSV – Pegelonline                        | (WSV)         |

Hinweis: Die Wetterdaten dienen ausschließlich der Informationsunterstützung und
ersetzen keine offiziellen Wetter- oder Hochwassermeldungen.

---

## 7. Häufige Fragen / Fehlerbehebung

**Das Dashboard lädt nicht / "OFFLINE".**
Sind beide Terminals geöffnet? Das Frontend kann nur liefern, wenn auch das Backend
unter Port 8000 läuft. Beide müssen aktiv sein.

**`run.bat` wird blockiert.**
Bitte die manuelle Variante (Abschnitt 4.2) verwenden.

**`python` bzw. `npm` wird im Terminal nicht erkannt.**
Die Programme wurden ohne „Add to PATH" installiert. Empfehlung: Neustart des
Terminals; falls es weiterhin nicht funktioniert, die Installation mit „Add to PATH"
wiederholen.

**Der Port ist schon belegt (Fehlermeldung beim Start).**
Ein anderes Programm nutzt den Port. Häufige Ursache: Eine alte Instanz läuft noch.
Die alten Terminals schließen und neu starten.

**Keine Live-Daten, aber die Seite lädt.**
Die externen Quellen sind ggf. gerade nicht erreichbar oder das Abfrage-Kontingent ist
kurzzeitig aufgebraucht. Das Dashboard zeigt dann einen dezenten Hinweis und holt die
Daten automatisch in einer späteren Runde nach.

---

## 8. Technische Übersicht (für Administratoren)

* **Backend:** Python, FastAPI, Uvicorn, WebSockets.
  * Python-Bibliotheken: siehe `backend/requirements.txt`.
* **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide Icons.
  * Node-Bibliotheken: siehe `frontend/package.json`.
* **Ports:** Backend 8000 (API + WebSockets), Frontend 5173 (Entwicklung).
* **Abfrage-Strategie:** Ruhemodus ohne Nutzer und service-spezifische Abklingzeiten
  (Wetter 10 min, Pegel 5 min, Einsatzdaten 1 h).
* **API-Budget-Messung:** Ein eigener Zähler (`backend/services/openmeteo_budget.py`)
  erfasst den Verbrauch der Open-Meteo-API gegen das Gratis-Kontingent (10.000 Aufrufe
  pro Tag pro IP) und liefert die Kennzahlen für die Budget-Anzeige.
* **Trend-Berechnung Pegel:** Die Tendenz wird als lineare Regression (geringste
  Quadrate) über den gewählten Zeitraum (1–24 h) aus den 15-Minuten-Messungen
  berechnet, statt über eine einfache Zwei-Punkt-Differenz – dadurch werden die
  kurzen Messschwankungen geglättet.

Diese technische Begründung (Warum diese Technik, warum diese Abfrage-Strategie)
findet sich im Begleitdokument **„Begründung für die Implementierung"**.
