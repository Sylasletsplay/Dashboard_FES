# Expandability (Erweiterbarkeit)

Das Dashboard wurde modular entwickelt, um knftige Erweiterungen (neue Module, Sensoren, Datenquellen) so reibungslos wie mglich zu integrieren.

## Frontend Widget Registry (`registry.ts`)
Alle mittleren Widgets werden dynamisch gerendert. 
Um ein neues Widget hinzuzufgen:
1. Erstelle eine neue React-Komponente unter `src/widgets/MyNewWidget.tsx`.
2. Die Komponente muss das Interface `WidgetProps` akzeptieren (bekommt `state`, `telemetry`, `theme`, etc.).
3. Registriere das Widget in `src/widgets/registry.ts`:
   ```typescript
   registerWidget({
     id: 'my_new_widget',
     title: 'Mein Neues Widget',
     category: 'S3',
     description: 'Zeigt wichtige neue Daten',
     icon: 'Activity',
     defaultVisible: true,
     component: MyNewWidget
   });
   ```
4. Das Widget kann nun dynamisch im Dashboard ein- und ausgeblendet werden.

## Backend State & Events
Das Python-Backend verfgt ber einen `StateManager`. 
- Wenn neue Datenstrukturen bentigt werden, knnen diese im Dictionary in `state_manager.py` hinzugefgt werden.
- Updates an den Frontend-Client erfolgen via WebSockets: `self._notify("MY_EVENT_TYPE", data)`.
- Das Frontend lauscht in `App.tsx` bzw. im `useWebSocket` Hook auf alle Broadcasts und rendert die UI automatisch neu (Reaktivitt).
