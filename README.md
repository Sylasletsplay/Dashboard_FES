# Das ist ein Schulprojekt!!!

# Katastrophenschutz Führungsstab – Stabs-Dashboard (DV 100)

Ein Dashboard für den Katastrophenschutz (Führungsstab), das einsatzrelevante
Fachdaten in Echtzeit bündelt: aktuelle Wetterlage, Berliner Pegelstände und die
Einsatzstatistik der Berliner Feuerwehr. Alle Daten stammen aus offiziellen
öffentlichen Schnittstellen und werden ohne manuelles Aktualisieren angezeigt.

Das System besteht aus zwei Teilen, die beide laufen müssen:

| Teil      | Aufgabe                                                            | Port   |
|-----------|--------------------------------------------------------------------|--------|
| **Backend** | Holt die Fachdaten von den Quellen und liefert sie per Echtzeit-Verbindung | `8000` |
| **Frontend**| Zeigt das Dashboard im Browser und empfängt die Live-Daten          | `5173` |

---

## Variante 1 – Ohne Installation (empfohlen)

Das einfachste Verfahren: Es muss nichts installiert werden. Das Dashboard ist
online erreichbar unter:

```
https://sylasletsplay.github.io/Dashboard_FES/
```

> Die Seite kann beim **ersten** Aufruf etwas Zeit zum Laden brauchen, da sie auf
> einem kostenlosen Dienst gehostet ist. Danach sind alle Funktionen direkt im
> Browser nutzbar. Diese Variante eignet sich, wenn das Dashboard nur **angezeigt**
> werden soll.

---

## Variante 2 – Lokal starten

Wer das Dashboard **lokal** starten möchte (z. B. zum Anpassen oder Weiterentwickeln),
braucht einmalig zwei Programme. Der normale Betrieb erfordert **kein**
Programmierungsvorwissen.

### Voraussetzungen (einmalig)

1. **Python 3.9 oder neuer** – `https://www.python.org/downloads/`
   * **Wichtig:** Im ersten Installationsfenster die Option **„Add Python to PATH"**
     **aktiviert** lassen.
2. **Node.js 18 oder neuer (LTS)** – `https://nodejs.org/`
   * Standardinstallation reicht aus. Node bringt den Paketverwalter `npm` mit.

### Projekt beziehen

Das Projekt wird aus dem Code-Archiv (Git) heruntergeladen:

```
git clone https://github.com/Sylasletsplay/Dashboard_FES.git
cd Dashboard_FES
```

> Ist `git` nicht installiert: kostenlos unter `https://git-scm.com/downloads`.
> **Alternative ohne Git:** Auf `https://github.com/Sylasletsplay/Dashboard_FES`
> den Button **Code → Download ZIP** wählen und den Ordner entpacken.

### Starten

#### Methode A: Start-Skript (Windows)

Die Datei `run.bat` im Projektordner erledigt alles automatisch (legt die
Python-Umgebung an, installiert die Abhängigkeiten, startet Backend und Frontend).

```
run.bat
```

Das Dashboard öffnet sich danach automatisch im Browser unter `http://localhost:5173`.

> **Wird `run.bat` blockiert** (z. B. durch eine eingeschränkte Sicherheitskonfiguration
> oder eine "Smart-App"-Prüfung): Methode B verwenden.

#### Methode B: Manuell (ohne Skript)

Diese Methode startet dieselben Schritte von Hand. Es werden **zwei** getrennte
Terminals benötigt, da Backend und Frontend jeweils eigenständig laufen. Alle
Befehle werden im **Projektordner** ausgeführt (siehe „Projekt beziehen").

**1. Python-Umgebung für das Backend anlegen (einmalig):**

```
python -m venv backend\venv
```

**2. Umgebung aktivieren und die Backend-Bibliotheken installieren:**

```
backend\venv\Scripts\activate
pip install -r backend\requirements.txt
```

*(Mac/Linux: statt `backend\venv\Scripts\activate` die Zeile `source backend/venv/bin/activate`.)*

**3. Frontend-Bibliotheken installieren (einmalig):**

```
cd frontend
npm install
```

**4a. Backend starten** – im Projektordner, mit aktivierter Umgebung:

```
backend\venv\Scripts\python backend\main.py
```

Das Backend läuft nun unter Port `8000`. Dieses Terminal **nicht** schließen.

**4b. Frontend starten** – ein **zweites** Terminal öffnen, ebenfalls im Projektordner:

```
cd frontend
npm run dev
```

Das Frontend läuft unter Port `5173`.

### Aufrufen

Das Dashboard ist betriebsbereit, wenn **beide** Terminals aktiv sind. Im Browser:

```
http://localhost:5173
```

Oben in der Kopfzeile zeigt der Status **LIVE**, sobald die Echtzeit-Verbindung zum
Backend besteht. Daneben steht der Zeitstempel des letzten Datenstands; über das
Symbol rechts oben lässt sich zwischen hellem und dunklem Anzeigen wechseln.
Jedes der drei Anzeigefelder hat zudem einen Knopf, mit dem die Daten
manuell neu geladen werden können. Zum Beenden: in beiden Terminals `Strg + C`.

---

## Typische Probleme

* **Seite lädt, aber Status „OFFLINE".** – Läuft das Backend unter Port `8000`?
  Frontend und Backend müssen **gleichzeitig** laufen.
* **`run.bat` wird blockiert.** – Methode B verwenden.
* **Start schlägt fehl, weil der Port schon belegt ist.** – Eine frühere
  Instanz des Dashboards läuft noch. Die alten Terminalfenster (Backend und
  Frontend) schließen und neu starten.
* **`python` bzw. `npm` wird nicht erkannt.** – Die Programme wurden ohne
  „Add to PATH" installiert. Terminal neu öffnen; ggf. Installation mit „Add to PATH"
  wiederholen.
* **Keine Live-Daten, Seite lädt aber.** – Die externen Quellen sind ggf. kurz
  nicht erreichbar. Das Dashboard zeigt dann einen dezenten Hinweis und holt die
  Daten automatisch in der nächsten Runde nach.
