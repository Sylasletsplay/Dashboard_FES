import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps } from '../types/widget';
import { 
  CloudRain, Sun, CloudSun, CloudLightning, 
  Wind, Calendar, AlertTriangle, Droplets, ChevronRight, ChevronLeft, Info, X, Cloud, CloudFog, Clock
} from 'lucide-react';
import { DayForecast } from '../types/dashboard';

interface WeatherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayForecast | null;
}

const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({ isOpen, onClose, day }) => {
  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !day) return null;

  const getWeatherIcon = (code: number, sizeClass = "w-12 h-12") => {
    if (code >= 95) return <CloudLightning className={`${sizeClass} text-amber-400`} />;
    if (code >= 51 && code <= 82) return <CloudRain className={`${sizeClass} text-cyan-400`} />;
    if (code >= 1 && code <= 3) return <CloudSun className={`${sizeClass} text-amber-300`} />;
    if (code === 45 || code === 48) return <CloudFog className={`${sizeClass} text-slate-400`} />;
    return <Sun className={`${sizeClass} text-yellow-400`} />;
  };

  const isSevere = day.warning_risk === 'Unwettergefahr' || day.warning_risk === 'Erhöht' || day.wind_gusts_kmh > 70;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-sm w-full p-5 shadow-2xl text-slate-100 select-text relative">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide uppercase">
              Detailprognose: {day.weekday}, {day.date.split('-').reverse().join('.')}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            {getWeatherIcon(day.weather_code)}
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight">
              {Math.round(day.temp_max)}°C <span className="text-slate-500 text-sm font-normal">Max</span>
            </div>
            <div className="text-sm font-bold text-slate-300">
              {day.condition}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Min Temp
              </span>
              <span className="font-mono text-cyan-400 font-bold text-sm">{Math.round(day.temp_min)}°C</span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> Regenrisiko
              </span>
              <span className="font-mono text-blue-300 font-bold text-sm">{day.precipitation_prob}%</span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-500" /> Niederschlag
              </span>
              <span className="font-mono text-slate-200 font-bold text-sm">
                {day.precipitation_sum !== undefined ? day.precipitation_sum : '--'} mm
                {day.snowfall_sum ? ` (${day.snowfall_sum} cm ❄)` : ''}
              </span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-300" /> Regendauer
              </span>
              <span className="font-mono text-slate-200 font-bold text-sm">
                {day.precipitation_hours !== undefined ? day.precipitation_hours : '--'} h
              </span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Wind className="w-3.5 h-3.5 text-slate-400" /> Grundwind
              </span>
              <span className="font-mono font-bold text-sm text-slate-300">
                {day.wind_speed_kmh !== undefined ? Math.round(day.wind_speed_kmh) : '--'} km/h
              </span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Wind className="w-3.5 h-3.5 text-slate-300" /> Spitzenböen
              </span>
              <span className={`font-mono font-bold text-sm ${day.wind_gusts_kmh > 45 ? 'text-red-400' : 'text-slate-300'}`}>
                {Math.round(day.wind_gusts_kmh)} km/h {day.winddirection ? `(${day.winddirection})` : ''}
              </span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Sun className="w-3.5 h-3.5 text-yellow-500" /> Sonne
              </span>
              <span className="font-mono text-yellow-400 font-bold text-sm">
                {day.sunshine_hours !== undefined ? `${day.sunshine_hours}h` : '--'}
              </span>
            </div>

            <div className="bg-slate-950/70 rounded p-2.5 border border-slate-800/50 flex flex-col justify-between">
              <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <CloudLightning className="w-3.5 h-3.5 text-purple-400" /> UV Index
              </span>
              <span className={`font-mono font-bold text-sm ${(day.uv_index || 0) > 6 ? 'text-red-400' : 'text-purple-300'}`}>
                {day.uv_index !== undefined ? day.uv_index : '--'}
              </span>
            </div>
          </div>

          <div className={`mt-2 rounded p-3 border flex justify-between items-center ${isSevere ? 'bg-red-950/30 border-red-900/50' : 'bg-slate-950/70 border-slate-800/50'}`}>
            <span className="text-slate-400 font-semibold text-xs flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${isSevere ? 'text-red-500' : 'text-emerald-500'}`} /> 
              Gefahrenpotential
            </span>
            <span className={`font-mono font-bold text-xs uppercase px-2 py-0.5 rounded border ${isSevere ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950/50 text-emerald-400 border-emerald-800'}`}>
              {day.warning_risk}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};


export const SevenDayForecastWidget: React.FC<WidgetProps> = ({ telemetry }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const forecast: DayForecast[] = telemetry.live?.forecast_7days || [
    { date: '2026-09-21', weekday: 'Heute', temp_min: 11, temp_max: 17, precipitation_prob: 25, wind_gusts_kmh: 34, weather_code: 3, condition: 'Teils bewölkt', warning_risk: 'Normal' },
    { date: '2026-09-22', weekday: 'Di', temp_min: 9, temp_max: 17, precipitation_prob: 5, wind_gusts_kmh: 28, weather_code: 1, condition: 'Sonnig', warning_risk: 'Normal' },
    { date: '2026-09-23', weekday: 'Mi', temp_min: 6, temp_max: 18, precipitation_prob: 0, wind_gusts_kmh: 20, weather_code: 0, condition: 'Sonnig', warning_risk: 'Normal' },
    { date: '2026-09-24', weekday: 'Do', temp_min: 8, temp_max: 17, precipitation_prob: 35, wind_gusts_kmh: 36, weather_code: 61, condition: 'Regenschauer', warning_risk: 'Normal' },
    { date: '2026-09-25', weekday: 'Fr', temp_min: 7, temp_max: 16, precipitation_prob: 10, wind_gusts_kmh: 22, weather_code: 2, condition: 'Teils bewölkt', warning_risk: 'Normal' },
    { date: '2026-09-26', weekday: 'Sa', temp_min: 8, temp_max: 20, precipitation_prob: 5, wind_gusts_kmh: 18, weather_code: 1, condition: 'Sonnig', warning_risk: 'Normal' },
    { date: '2026-09-27', weekday: 'So', temp_min: 12, temp_max: 22, precipitation_prob: 15, wind_gusts_kmh: 24, weather_code: 2, condition: 'Heiter', warning_risk: 'Normal' },
  ];

  const getWeatherIcon = (code: number) => {
    if (code >= 95) return <CloudLightning className="w-8 h-8 text-amber-400" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-8 h-8 text-cyan-400" />;
    if (code >= 1 && code <= 3) return <CloudSun className="w-8 h-8 text-amber-300" />;
    return <Sun className="w-8 h-8 text-yellow-400" />;
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full kats-panel rounded-lg flex flex-col overflow-hidden select-none relative group">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="font-bold text-[10px] uppercase tracking-wider font-mono text-slate-100">
            Wetter DWD-ICON
          </h3>
        </div>
        <div className="flex gap-1">
          <button onClick={scrollLeft} className="p-0.5 hover:bg-slate-700 rounded"><ChevronLeft className="w-3 h-3 text-slate-300"/></button>
          <button onClick={scrollRight} className="p-0.5 hover:bg-slate-700 rounded"><ChevronRight className="w-3 h-3 text-slate-300"/></button>
        </div>
      </div>

      {/* Scrollable Area */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar flex-1 items-center bg-slate-900/30"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {forecast.map((day, idx) => {
          const isToday = idx === 0;
          
          return (
            <div 
              key={idx} 
              className="min-w-full w-full h-full snap-center flex-shrink-0 flex flex-col justify-center items-center p-2 cursor-pointer transition-colors hover:bg-slate-800/30"
              onClick={() => setSelectedDayIndex(idx)}
            >
              <div className="w-full flex justify-between items-center px-2 mb-1">
                <span className={`text-xs font-bold font-mono ${isToday ? 'text-amber-400' : 'text-slate-200'}`}>
                  {day.weekday}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {day.date.includes('-') ? day.date.split('-').slice(1).join('.') : day.date}
                </span>
              </div>
              
              <div className="flex items-center gap-4 my-1">
                {getWeatherIcon(day.weather_code)}
                <div className="flex flex-col">
                  <span className="text-sm font-bold font-mono text-slate-100">{Math.round(day.temp_max)}°C</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{day.condition}</span>
                </div>
              </div>
              
              <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-2.5 h-2.5"/> Details
              </div>
            </div>
          );
        })}
      </div>

      <WeatherDetailModal 
        isOpen={selectedDayIndex !== null}
        onClose={() => setSelectedDayIndex(null)}
        day={selectedDayIndex !== null ? forecast[selectedDayIndex] : null}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};
