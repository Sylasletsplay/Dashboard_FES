export interface WaterLevelReading {
  station: string;
  level_cm: number;
  trend: 'steigend' | 'fallend' | 'gleichbleibend' | string;
  delta_3h: string;
  trend_map?: Record<string, string>;
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
  /** Highest active official DWD Warnstufe (0 = none, 1-4). */
  warning_level: number;
  warning_text: string;
  /** false when the DWD warnings feed could not be fetched. */
  warnings_available?: boolean;
  warnings?: DwdWarning[];
  error?: string | null;
}

export interface DwdWarning {
  level: number;
  event: string;
  headline: string;
  onset: string | null;
  expires: string | null;
}

export interface DayForecast {
  date: string;
  weekday: string;
  temp_min: number;
  temp_max: number;
  precipitation_prob: number;
  wind_gusts_kmh: number;
  wind_speed_kmh?: number;
  condition: string;
  warning_risk: string;
  precipitation_sum?: number;
  uv_index?: number;
}

export interface HourlyForecast {
  time: string;
  temperature_c: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  condition: string;
}

export interface LiveTelemetry {
  water_levels: WaterLevelReading[];
  fire_missions_yesterday?: number;
  fire_data_date?: string;
  mission_count_ems?: number;
  mission_count_tech?: number;
  mission_count_all?: number;
  hauptbeschwerden?: { name: string; value: number }[];
  weather: WeatherTelemetry;
  water_levels_error?: string | null;
  fire_data_error?: string | null;
  forecast_7days?: DayForecast[];
  forecast_24h?: HourlyForecast[];
}

export interface TelemetryState {
  isConnected: boolean;
  lastUpdate: Date | null;
  // null until the server has sent real data - never show placeholder values
  live: LiveTelemetry | null;
}

export type RefreshWidget = 'weather' | 'pegel' | 'fire';

// Lifecycle of a manual refresh button press. 'cooldown' = server skipped it
// because the feed was fetched less than MANUAL_REFRESH_MIN_GAP seconds ago.
export interface RefreshStatus {
  status: 'loading' | 'ok' | 'cooldown' | 'error';
  retryIn?: number;
}

export type Theme = 'dark' | 'light';
