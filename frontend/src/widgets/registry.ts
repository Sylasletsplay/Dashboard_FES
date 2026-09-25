import { WidgetDefinition } from '../types/widget';
import { ThreatAssessmentWidget } from './ThreatAssessmentWidget';
import { IncidentsWidget } from './IncidentsWidget';
import { UnitMatrixWidget } from './UnitMatrixWidget';
import { LogbookWidget } from './LogbookWidget';
import { FeedStatusWidget } from './FeedStatusWidget';

const widgetRegistry: Map<string, WidgetDefinition> = new Map();

export function registerWidget(definition: WidgetDefinition) {
  widgetRegistry.set(definition.id, definition);
}

export function getWidgets(): WidgetDefinition[] {
  return Array.from(widgetRegistry.values());
}

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return widgetRegistry.get(id);
}

// Register default KatS widgets
registerWidget({
  id: 'threats',
  title: 'S2 Lage & Gefahren',
  category: 'S2',
  description: 'Gefahrenbeurteilung, Lagebericht-Notizen und Personal-Lagekennzahlen',
  icon: 'ShieldAlert',
  defaultVisible: true,
  component: ThreatAssessmentWidget,
});

registerWidget({
  id: 'logbook',
  title: 'Einsatztagebuch (ETB)',
  category: 'S2',
  description: 'Offizieller chronologischer Stabsdienst-Meldeblock nach DV 100',
  icon: 'BookOpen',
  defaultVisible: true,
  component: LogbookWidget,
});

registerWidget({
  id: 'telemetry',
  title: 'Live-Telemetrie & Datenstrom',
  category: 'SYSTEM',
  description: 'Echtzeit-Verbindungsstatus, WebSocket-Latenz und Datenfluss',
  icon: 'Activity',
  defaultVisible: true,
  component: FeedStatusWidget,
});
