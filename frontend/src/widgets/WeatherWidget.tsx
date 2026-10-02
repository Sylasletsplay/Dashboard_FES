import React, { useState, useRef } from 'react';
import { WidgetContainer } from '../components/WidgetContainer';
import { Wind, Thermometer, CloudRain, Gauge, Sun, AlertTriangle, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LiveTelemetry, DayForecast } from '../types/dashboard';

interface WeatherWidgetProps {
  telemetry: LiveTelemetry;
  error?: string | null;
  onRefresh?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ telemetry, error, onRefresh }) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const hourlyScrollRef = useRef<HTMLDivElement>(null);
  const scrollHourly = (dir: number) => {
    hourlyScrollRef.current?.scrollBy({ left: dir * 120, behavior: 'smooth' });
  };
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
      <div className="shrink-0 min-h-0 max-h-[62%] flex flex-col">
        <WidgetContainer 
          title="Aktuell" 
          subtitle="Wetter-Sensorik & DWD"
          icon={Wind} 
          iconColor="text-amber-500"
          className="flex-1 min-h-0"
          contentClassName="overflow-y-auto custom-scroll"
          headerRight={
            onRefresh && (
              <button onClick={onRefresh} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-500" title="Aktualisieren">
                <RefreshCcw className="w-4 h-4" />
              </button>
            )
          }
        >
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
                <span className="text-[13px] text-slate-500 flex items-center gap-1.5 mb-0.5">
                  <Wind className="w-3 h-3 text-cyan-500" /> Wind
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {live.wind_speed_kmh} <span className="text-[13px] font-normal text-slate-500">km/h</span>
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
                <span className="text-[13px] text-slate-500 flex items-center gap-1.5 mb-0.5">
                  <Thermometer className="w-3 h-3 text-red-500" /> Temp
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {live.temperature_c}°C
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center">
                <span className="text-[13px] text-slate-500 flex items-center gap-1.5 mb-0.5">
                  <Gauge className="w-3 h-3 text-indigo-500" /> Luftdruck
                </span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">
                  {live.air_pressure_hpa} <span className="text-[13px] font-normal text-slate-500">hPa</span>
                </span>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                <span className="text-[13px] text-slate-500 flex items-center gap-1.5 mb-0.5">
                  <Wind className="w-3 h-3 text-cyan-500" /> Windrichtung
                </span>
                <span className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {live.wind_direction}
                </span>
                <div className="text-[12px] text-slate-500 mt-0.5">Böen bis {live.wind_gusts_kmh} km/h</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <CloudRain className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[14px] text-slate-500 leading-tight">Niederschlag</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                    {live.precipitation_mm} <span className="text-[14px] font-normal text-slate-500">mm/h</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                <Sun className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[14px] text-slate-500 leading-tight">UV-Index</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                    {forecast[0]?.uv_index ?? '-'} <span className="text-[14px] font-normal text-slate-500">Max</span>
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-2 rounded-lg border ${
              live.warning_level >= 3 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' : 
              live.warning_level >= 1 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 
              'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
            }`}>
              <span className="text-[15px] font-bold flex items-center gap-1.5 mb-0.5 text-slate-800 dark:text-slate-200">
                <AlertTriangle className={`w-3.5 h-3.5 ${
                  live.warning_level >= 3 ? 'text-red-500' : live.warning_level >= 1 ? 'text-amber-500' : 'text-emerald-500'
                }`} /> 
                Warnstufe {live.warning_level}
              </span>
              <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-tight">
                {live.warning_text !== "Keine Warnung" ? live.warning_text : "Keine amtlichen Wetterwarnungen des DWD."}
              </p>
            </div>

            {/* 24h Hourly Forecast */}
            {telemetry.forecast_24h && telemetry.forecast_24h.length > 0 && (
              <div className="mt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-slate-500 font-semibold uppercase tracking-wide">Stündlich (24h)</span>
                  <div className="flex gap-1">
                    <button onClick={() => scrollHourly(-1)} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Zurück scrollen">
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => scrollHourly(1)} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Weiter scrollen">
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
                <div
                  ref={hourlyScrollRef}
                  className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onWheel={(e) => {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }}
                >
                {telemetry.forecast_24h.map((hour, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-shrink-0 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 min-w-[48px]">
                    <span className="text-[12px] text-slate-500 font-mono mb-0.5">{hour.time}</span>
                    <span className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{hour.temperature_c}°</span>
                    {hour.precipitation_mm > 0 ? (
                      <span className="text-[12px] text-blue-500 mt-0.5 flex items-center gap-0.5 font-semibold">
                        <CloudRain className="w-2.5 h-2.5" />
                        {hour.precipitation_mm}
                      </span>
                    ) : (
                      <span className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                        <CloudRain className="w-2.5 h-2.5 opacity-50" />
                        0
                      </span>
                    )}
                  </div>
                ))}
                </div>
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
        className="flex-1 min-h-[260px]"
        contentClassName="flex flex-col p-2 gap-1"
      >
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto custom-scroll">
          {next7Days.map((day: DayForecast, i: number) => {
            const isExpanded = expandedDay === i;
            return (
            <div 
              key={i} 
              className={`flex-shrink-0 flex flex-col px-3 py-2 min-h-[56px] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800`}
              onClick={() => {
                setExpandedDay(isExpanded ? null : i);
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
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300 font-mono shrink-0">
                    <Wind className="w-3 h-3 text-cyan-500" />
                    <strong className="font-bold">{day.wind_gusts_kmh ?? day.wind_speed_kmh ?? 0}</strong>
                    <span className="text-slate-500">km/h</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300 font-mono shrink-0">
                    <Sun className="w-3 h-3 text-yellow-500" />
                    <strong className="font-bold">{day.uv_index ?? '-'}</strong>
                    <span className="text-slate-500">UV</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300 font-mono shrink-0">
                    <CloudRain className="w-3 h-3 text-blue-500" />
                    <strong className="font-bold">{day.precipitation_sum ?? 0}</strong>
                    <span className="text-slate-500">mm</span>
                  </span>
                  {day.warning_risk && day.warning_risk !== "Keine Warnung" && (
                    <span className="flex items-center gap-1 text-[12px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      {day.warning_risk}
                    </span>
                  )}
                </div>
              )}
            </div>
          )})}
          {next7Days.length === 0 && (
            <div className="text-slate-500 text-center py-4 text-lg flex items-center justify-center">Lade Vorhersage...</div>
          )}
        </div>
        <div className="shrink-0 h-10 flex flex-col justify-center px-3 pt-1 border-t border-slate-200 dark:border-slate-800/60">
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] leading-tight text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
          >
            © Open-Meteo.com (CC BY 4.0), DWD-ICON-Modell
          </a>
          <p className="text-[10px] leading-tight text-slate-400/80">
            Nur zu Informationszwecken – nicht für operative Wettereinsätze.
          </p>
        </div>
      </WidgetContainer>
    </div>
  );
};


