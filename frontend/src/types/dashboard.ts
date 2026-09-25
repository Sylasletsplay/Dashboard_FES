export type FMSStatus = 1 | 2 | 3 | 4 | 5 | 6;

export interface Unit {
  id: string;
  callsign: string;
  name: string;
  org: 'Feuerwehr' | 'THW' | 'Rettungsdienst' | 'DLRG' | 'KatS-Führungsstaffel' | string;
  status: FMSStatus;
  strength: string; // e.g. "1/2/3/6" or "0/1/8/9"
  sector: string;
  location: [number, number]; // [lat, lng]
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  priority: 1 | 2 | 3; // 1 = Kritisch/Rot, 2 = Dringlich/Gelb, 3 = Normal/Blau
  sector: string;
  status: 'Gemeldet' | 'In Bearbeitung' | 'Unter Kontrolle' | 'Erledigt';
  assigned_units: string[]; // array of unit IDs or callsigns
  location: [number, number];
  created_at: string;
}

export interface ThreatAssessment {
  hochwasser: string;
  unwetter: string;
  kritis: string;
  notes: string;
}

export interface ETBEntry {
  id: number;
  timestamp: string;
  sender: string;
  recipient: string;
  content: string;
  action?: string;
}

export interface KatSState {
  alarm_level: number; // 0, 1, 2, 3
  alarm_title: string;
  threat_assessment: ThreatAssessment;
  incidents: Incident[];
  units: Unit[];
  etb: ETBEntry[];
  custom_widgets?: Record<string, any>;
}

export interface WaterLevelReading {
  station: string;
  level_cm: number;
  trend: 'steigend' | 'fallend' | 'gleichbleibend' | string;
  delta_1h: string;
  danger_level: number;
  max_normal: number;
  char_vals?: Record<string, number>;
  history?: { time: string; value: number }[];
}

export interface WeatherTelemetry {
  temperature_c: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  wind_direction: string;
  precipitation_mm: number;
  air_pressure_hpa: number;
  warning_level: number;
  warning_text: string;
}

export interface KritisTelemetry {
  power_grid: { status: string; label: string; load_percent: number };
  water_supply: { status: string; label: string; pressure_bar: number };
  communication: { status: string; label: string; redundancy: string };
}

export interface DayForecast {
  date: string;
  weekday: string;
  temp_min: number;
  temp_max: number;
  precipitation_prob: number;
  wind_gusts_kmh: number;
  wind_speed_kmh?: number;
  weather_code: number;
  condition: string;
  warning_risk: string;
  precipitation_sum?: number;
  precipitation_hours?: number;
  snowfall_sum?: number;
  uv_index?: number;
  winddirection?: string;
  sunshine_hours?: number;
}

export interface HourlyForecast {
  time: string;
  temperature_c: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  condition: string;
  weather_code: number;
}

export interface LiveTelemetry {
  last_updated: string;
  current_city?: string;
  water_levels: WaterLevelReading[];
  fire_missions_yesterday?: number;
  fire_data_date?: string;
  mission_count_ems?: number;
  mission_count_tech?: number;
  mission_count_all?: number;
  hauptbeschwerden?: { name: string; value: number }[];
  weather: WeatherTelemetry;
  forecast_7days?: DayForecast[];
  forecast_24h?: HourlyForecast[];
  kritis: KritisTelemetry;
}

export interface TelemetryState {
  isConnected: boolean;
  lastPingMs: number;
  lastUpdate: Date | null;
  eventsReceived: number;
  isLiveFeed: boolean;
  serverTime: string | null;
  connectedClients: number;
  uptimeSeconds: number;
  live: LiveTelemetry;
}
