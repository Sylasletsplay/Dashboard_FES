import React, { useState } from 'react';
import { WidgetContainer } from '../components/WidgetContainer';
import { Wind, Thermometer, CloudRain, Gauge, Sun, AlertTriangle, RefreshCcw } from 'lucide-react';
import { LiveTelemetry, DayForecast } from '../types/dashboard';

interface WeatherWidgetProps {
  telemetry: LiveTelemetry;
  error?: string | null;
  onRefresh?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ telemetry, error, onRefresh }) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const live = telemetry.weather;
  const forecast = telemetry.forecast_7days || [];

  // Limit forecast to exactly 7 days
  const next7Days = forecast.slice(0, 7);
  
  const telemetryError = error || live.error;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {telemetryError && (
        <div className="bg-red-950/30 border border-red-800 text-red-300 p-3 rounded-lg flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{telemetryError}</span>
        </div>
      )}
      {/* Top: Aktuell */}
      <div className="flex-shrink-0">
        <WidgetContainer 
          title="Aktuell" 
          subtitle="Wetter-Sensorik & DWD"
          icon={Wind} 
          iconColor="text-amber-500"
          headerRight={
            onRefresh && (
              <button onClick={onRefresh} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-500" title="Aktualisieren">
                <RefreshCcw className="w-4 h-4" />
              </button>
            )
          }
        >
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
                <span className="text-[14px] text-slate-500 flex items-center gap-1.5 mb-1">
                  <Wind className="w-3 h-3 text-cyan-500" /> Wind
                </span>
                <span className="text-3xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {live.wind_speed_kmh} <span className="text-[14px] font-normal text-slate-500">km/h</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
                <span className="text-[14px] text-slate-500 flex items-center gap-1.5 mb-1">
                  <Thermometer className="w-3 h-3 text-red-500" /> Temp
                </span>
                <span className="text-3xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {live.temperature_c}°C
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center">
                <span className="text-[14px] text-slate-500 flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3 h-3 text-indigo-500" /> Luftdruck
                </span>
                <span className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">
                  {live.air_pressure_hpa} <span className="text-[14px] font-normal text-slate-500">hPa</span>
                </span>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center text-center">
                <span className="text-[14px] text-slate-500 flex items-center gap-1.5 mb-1">
                  <Wind className="w-3 h-3 text-cyan-500" /> Windrichtung
                </span>
                <span className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {live.wind_direction}
                </span>
                <div className="text-[13px] text-slate-500 mt-1">Böen bis {live.wind_gusts_kmh} km/h</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <CloudRain className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[14px] text-slate-500 leading-tight">Niederschlag</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                    {live.precipitation_mm} <span className="text-[14px] font-normal text-slate-500">mm/h</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <Sun className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[14px] text-slate-500 leading-tight">UV-Index</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                    {forecast[0]?.uv_index ?? '-'} <span className="text-[14px] font-normal text-slate-500">Max</span>
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              live.warning_level >= 3 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' : 
              live.warning_level >= 1 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 
              'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
            }`}>
              <span className="text-[16px] font-bold flex items-center gap-1.5 mb-1 text-slate-800 dark:text-slate-200">
                <AlertTriangle className={`w-3.5 h-3.5 ${
                  live.warning_level >= 3 ? 'text-red-500' : live.warning_level >= 1 ? 'text-amber-500' : 'text-emerald-500'
                }`} /> 
                Warnstufe {live.warning_level}
              </span>
              <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-tight">
                {live.warning_text !== "Keine Warnung" ? live.warning_text : "Keine amtlichen Wetterwarnungen des DWD."}
              </p>
            </div>

            {/* 24h Hourly Forecast */}
            {telemetry.forecast_24h && telemetry.forecast_24h.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {telemetry.forecast_24h.map((hour, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[55px]">
                    <span className="text-[13px] text-slate-500 font-mono mb-1">{hour.time}</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100">{hour.temperature_c}°</span>
                    {hour.precipitation_mm > 0 ? (
                      <span className="text-[13px] text-blue-500 mt-1 flex items-center gap-0.5 font-semibold">
                        <CloudRain className="w-2.5 h-2.5" />
                        {hour.precipitation_mm}
                      </span>
                    ) : (
                      <span className="text-[13px] text-slate-400 mt-1 flex items-center gap-0.5">
                        <CloudRain className="w-2.5 h-2.5 opacity-50" />
                        0
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </WidgetContainer>
      </div>

      {/* Bottom: Vorhersage */}
      <WidgetContainer 
        title="Vorhersage" 
        subtitle="Next 7 Days"
        icon={Sun} 
        iconColor="text-yellow-500"
        className="flex-1 min-h-0"
        contentClassName="p-2 overflow-y-auto"
      >
        <div className="flex flex-col gap-2">
          {next7Days.map((day: DayForecast, i: number) => {
            const isExpanded = expandedDay === i && i !== 0;
            return (
            <div 
              key={i} 
              className={`flex-shrink-0 flex flex-col px-4 py-3 min-h-[64px] bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm ${i !== 0 ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors' : ''}`}
              onClick={() => {
                if (i !== 0) {
                  setExpandedDay(isExpanded ? null : i);
                }
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col min-w-[70px]">
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-200 leading-tight">{day.weekday}</span>
                  <span className="text-[14px] text-slate-500 font-mono leading-tight mt-0.5">{day.date.split('-').slice(1).join('.')}</span>
                </div>
                
                <div className="flex flex-col items-center flex-1 px-2">
                   <span className="text-base text-slate-600 dark:text-slate-300 leading-tight truncate w-full text-center font-medium">{day.condition}</span>
                   {day.precipitation_prob > 20 && (
                     <span className="text-[14px] text-blue-500 flex items-center gap-1 leading-tight mt-1 font-semibold">
                       <CloudRain className="w-3 h-3" /> {day.precipitation_prob}%
                     </span>
                   )}
                </div>

                <div className="flex items-center gap-2 font-mono text-lg min-w-[80px] justify-end">
                  <span className="text-blue-500 dark:text-blue-300 font-medium">{day.temp_min}°</span>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-red-500 dark:text-red-400 font-bold text-xl">{day.temp_max}°</span>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center">
                      <span className="text-[14px] text-slate-500 flex items-center gap-1.5 mb-1">
                        <Wind className="w-3 h-3 text-cyan-500" /> Max Wind
                      </span>
                      <span className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
                        {day.wind_gusts_kmh ?? day.wind_speed_kmh ?? 0} <span className="text-[14px] font-normal text-slate-500">km/h</span>
                      </span>
                    </div>
      
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center">
                      <span className="text-[14px] text-slate-500 flex items-center gap-1.5 mb-1">
                        <Sun className="w-3 h-3 text-yellow-500" /> UV / Sonne
                      </span>
                      <span className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
                        {day.uv_index ?? '-'} <span className="text-[14px] font-normal text-slate-500">UV</span>
                      </span>
                    </div>
                  </div>
      
                  <div className="bg-white dark:bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <CloudRain className="w-5 h-5 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="text-[14px] text-slate-500">Regenmenge</span>
                          <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
                            {day.precipitation_sum ?? 0} mm
                          </span>
                        </div>
                     </div>
                  </div>

                  {day.warning_risk && day.warning_risk !== "Keine Warnung" && (
                    <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                      <span className="text-[16px] font-bold flex items-center gap-1.5 mb-1 text-slate-800 dark:text-slate-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 
                        Warnrisiko
                      </span>
                      <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-tight">
                        {day.warning_risk}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
          {next7Days.length === 0 && (
            <div className="text-slate-500 text-center py-4 text-lg flex items-center justify-center">Lade Vorhersage...</div>
          )}
        </div>
      </WidgetContainer>
    </div>
  );
};


