import React from 'react';
import { WidgetProps } from '../types/widget';
import { RiverLevelChart } from '../components/charts/RiverLevelChart';
import { 
  Activity, Waves, Wind, Thermometer, CloudRain, 
  Gauge, Wifi, WifiOff, TrendingUp, TrendingDown, Minus, Clock, ArrowUp, ArrowDown, ArrowRight, Flame
} from 'lucide-react';

export const TelemetryDashboard: React.FC<WidgetProps> = ({ telemetry, theme }) => {
  const isLive = telemetry.isConnected && telemetry.isLiveFeed;
  const live = telemetry.live || {
    water_levels: [],
    weather: { temperature_c: 14, wind_speed_kmh: 20, wind_gusts_kmh: 35, wind_direction: 'W', precipitation_mm: 0, air_pressure_hpa: 1013, warning_level: 0, warning_text: 'Keine Warnung' }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'steigend') return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
    if (trend === 'fallend') return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getDangerBadge = (danger: number, status: string) => {
    if (danger >= 2) {
      return <span className="px-2 py-0.5 rounded text-[14px] font-bold bg-red-950 text-red-300 border border-red-700 animate-pulse">{status}</span>;
    }
    if (danger === 1) {
      return <span className="px-2 py-0.5 rounded text-[14px] font-bold bg-amber-950 text-amber-300 border border-amber-700">{status}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[14px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">{status}</span>;
  };

  return (
    <div className="h-full flex flex-col kats-panel rounded-lg p-3 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
          <h3 className="font-bold text-base uppercase tracking-wider font-mono">
            Echtzeit-Telemetrie & KatS-Sensorik
          </h3>
        </div>
        <div className="flex items-center gap-3 text-base font-mono">
          <span className="text-[16px] text-slate-400">
            Stand: <strong className="text-slate-200">{telemetry.lastUpdate ? telemetry.lastUpdate.toLocaleTimeString('de-DE') : '--:--:--'}</strong>
          </span>
          <span className={`text-[14px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
            isLive 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700' 
              : 'bg-red-950/60 text-red-300 border-red-700'
          }`}>
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive ? `LIVE (${telemetry.lastPingMs > 0 ? `${telemetry.lastPingMs}ms` : '<1ms'})` : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 mt-3 overflow-hidden">
        
        {/* Top: River Gauges (Pegelonline) */}
        <div className="flex-[5] flex flex-col kats-panel-sub rounded-lg p-2.5 overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80">
            <span className="flex items-center gap-1.5 text-base font-bold text-cyan-400">
              <Waves className="w-4 h-4" />
              Pegelstände & Hochwasser (WSV)
            </span>
            <span className="text-[14px] text-slate-400 font-mono">cm / 1h-Tendenz</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
            {live.water_levels && live.water_levels.length > 0 ? (
              live.water_levels.map((pegel, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/90 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-slate-100">{pegel.station}</span>
                    {getDangerBadge(pegel.danger_level, "")}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl font-extrabold text-cyan-400">
                        {pegel.level_cm}
                      </span>
                      <span className="text-base text-slate-400">cm</span>
                    </div>

                    <div className="flex items-center gap-1 text-base font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {getTrendIcon(pegel.trend)}
                      <span className="text-slate-200">{pegel.delta_1h}</span>
                    </div>
                  </div>

                  {/* Scientific Historical Chart */}
                  <RiverLevelChart data={pegel.history} hw1={pegel.max_normal} theme={theme} />

                  {/* Visual gauge threshold bar */}
                  <div className="space-y-0.5 mt-0.5">
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          pegel.danger_level >= 2 ? 'bg-red-500' : pegel.danger_level === 1 ? 'bg-amber-400' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(12, (pegel.level_cm / (pegel.max_normal || 600)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[13px] text-slate-500 font-mono">
                      <span>Normal</span>
                      <span>Meldestufe 1 ({pegel.max_normal}cm)</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-base text-slate-500">Keine Pegeldaten geladen</div>
            )}
          </div>
        </div>

        {/* Bottom: Live Weather Telemetry & Fire Data */}
        <div className="flex-[4] flex flex-row gap-2.5 min-h-0 overflow-hidden">
          
          {/* Weather Sensorics Card */}
          <div className="flex-[2] kats-panel-sub rounded-lg p-2.5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 text-base font-bold text-amber-400">
                <Wind className="w-4 h-4" />
                Aktuelle Wetter-Sensorik & DWD
              </span>
              <span className="text-[14px] text-slate-400 font-mono">Live-Messwerte</span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-1">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[14px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> Wind & Böen
                </span>
                <div className="mt-1">
                  <span className="text-xl font-extrabold font-mono text-slate-100">
                    {live.weather.wind_speed_kmh} <span className="text-base font-normal text-slate-400">km/h</span>
                  </span>
                  <div className="text-[16px] font-mono text-amber-400">
                    Böen: {live.weather.wind_gusts_kmh} km/h ({live.weather.wind_direction})
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[14px] text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-red-400" /> Temperatur
                </span>
                <div className="mt-1">
                  <span className="text-xl font-extrabold font-mono text-slate-100">
                    {live.weather.temperature_c}°C
                  </span>
                  <div className="text-[16px] font-mono text-slate-400 flex items-center gap-0.5">
                    <Gauge className="w-3 h-3 text-slate-500" /> {live.weather.air_pressure_hpa} hPa
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[14px] text-slate-400 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-blue-400" /> Niederschlag
                </span>
                <div className="mt-0.5">
                  <span className="text-lg font-bold font-mono text-slate-100">
                    {live.weather.precipitation_mm} <span className="text-base font-normal text-slate-400">mm/h</span>
                  </span>
                  <div className="text-[14px] text-slate-400">
                    {live.weather.precipitation_mm > 5 ? 'Starkregen' : 'Trocken / Mäßig'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[14px] text-slate-400">DWD Akut-Warnlage</span>
                <div className="mt-0.5">
                  <span className={`text-base font-bold font-mono ${
                    live.weather.warning_level >= 3 ? 'text-red-400' : live.weather.warning_level >= 1 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {live.weather.warning_level > 0 ? `Warnstufe ${live.weather.warning_level}` : 'Keine Warnung'}
                  </span>
                  <div className="text-[14px] text-slate-400 truncate">
                    {live.weather.warning_text}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fire Missions Card */}
          <div className="flex-1 kats-panel-sub rounded-lg p-2.5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 text-base font-bold text-red-500">
                <Flame className="w-4 h-4" />
                Brände (Berliner Feuerwehr)
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center py-2">
              <span className="text-[14px] text-slate-400 uppercase tracking-widest mb-1">
                Letzter Stand ({live.fire_data_date || "--"})
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black font-mono text-red-500 drop-shadow-md">
                  {live.fire_missions_yesterday !== undefined ? live.fire_missions_yesterday : "--"}
                </span>
                <span className="text-lg font-bold text-slate-400">Einsätze</span>
              </div>
              <div className="text-[14px] text-slate-500 mt-2 text-center px-4">
                Quelle: Berliner Feuerwehr Open Data
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
