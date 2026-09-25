# User Interface (UI)

Das Dashboard wurde speziell fr den Einsatz im **Katastrophenschutz (KatS)** und in Stben konzipiert. Der Fokus liegt auf bersichtlichkeit, Kontrast und sofortiger Erfassbarkeit von kritischen Informationen.

## Layout & Grid-System
- **100vh Constraint:** Das Dashboard ist strikt auf die Bildschirmhhe begrenzt (`h-screen`, `overflow-hidden`). Es gibt **kein** seitenbergreifendes Scrollen. Nur spezifische Bereiche (wie die Pegel-Liste oder das Einsatztagebuch) drfen intern scrollen. Das sorgt fr ein statisches, leitstand-artiges Gefhl.
- **3-Spalten Architektur:** Das Layout nutzt ein CSS-Grid (12 Spalten):
  - **Links (3 Spalten):** Telemetrie & Sensorik (Wetter, Pegelstnde).
  - **Mitte (6 Spalten):** Dynamische Widgets (Gefahrenbewertung, etc.).
  - **Rechts (3 Spalten):** Vorhersagen (7-Tage Wetter) und Systemstatus.

## Design-Sprache
- **Frameworks:** React (Vite), Tailwind CSS, Lucide-React (Icons), Recharts (Diagramme).
- **Typografie:** Einsatz von `font-mono` (Monospace) fr alle Messwerte und Zahlen, um Tabellen-artige Lesbarkeit zu garantieren. `tracking-tight` fr groe Werte.
- **Wissenschaftliche Diagramme:** Das Pegel-Diagramm (`RiverLevelChart`) nutzt reduzierte Gitterlinien, lineare Interpolation (keine knstlichen Kurven) und klare Achsen-Beschriftungen nach wissenschaftlichen Standards.

## Theming (Light / Dark Mode)
Das System untersttzt einen vollwertigen Dark Mode und Light Mode. 
- Gesteuert wird dies ber einen State in der `App.tsx` und die CSS-Klassen `.dark` bzw. `.light` auf dem `<html>` Element.
- Farbpaletten wurden in `index.css` via CSS-Variablen definiert, um einen nahtlosen bergang ohne harte Kontrastbrche zu ermglichen. Standardmig startet das Dashboard im Light Mode.
