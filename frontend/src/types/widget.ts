import React from 'react';
import { KatSState, TelemetryState } from './dashboard';

export interface WidgetProps {
  state: KatSState;
  telemetry: TelemetryState;
  sendEvent: (type: string, data?: any) => void;
  theme: 'dark' | 'light';
}

export type StaffCategory = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'SYSTEM';

export interface WidgetDefinition {
  id: string;
  title: string;
  category: StaffCategory;
  description: string;
  icon: string;
  defaultVisible: boolean;
  component: React.ComponentType<WidgetProps>;
}
