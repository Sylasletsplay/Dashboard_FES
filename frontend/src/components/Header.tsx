import React, { useState, useEffect } from 'react';
import { KatSState, TelemetryState } from '../types/dashboard';
import { Shield, Radio, Sun, Moon, Maximize2, Minimize2, Sliders, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  state: KatSState;
  telemetry: TelemetryState;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAlarmModal: () => void;
  onOpenWidgetModal: () => void;
  onChangeCity?: (city: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  telemetry,
  theme,
  onToggleTheme,
  onOpenAlarmModal,
  onOpenWidgetModal,
  onChangeCity,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const getAlarmBadgeStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-amber-950 text-amber-300 border-amber-500 shadow-amber-500/20';
      case 2:
        return 'bg-orange-950 text-orange-300 border-orange-500 shadow-orange-500/20';
      case 3:
        return 'bg-red-950 text-red-300 border-red-500 shadow-red-500/30 animate-pulse-fast';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-emerald-500/20';
    }
  };

  // Format UTC Zulu string
  const zuluHours = String(currentTime.getUTCHours()).padStart(2, '0');
  const zuluMinutes = String(currentTime.getUTCMinutes()).padStart(2, '0');
  const zuluSeconds = String(currentTime.getUTCSeconds()).padStart(2, '0');
  const zuluString = `${zuluHours}:${zuluMinutes}:${zuluSeconds}Z`;

  const localString = currentTime.toLocaleTimeString('de-DE');

  return (
    <header className="h-12 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 select-none">
      {/* Left: Organization Title & Alarm Stufe */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-500 flex items-center justify-center text-white shadow">
            <Shield className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm tracking-wider uppercase text-slate-100 font-mono">
                KatS Führungsstab
              </h1>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                DV 100
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Lage- & Stabszentrum
            </div>
          </div>
        </div>

        {/* Alarmstufe Badge (Interactive) */}
        <button
          onClick={onOpenAlarmModal}
          className={`px-2.5 py-1 rounded border font-mono font-bold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105 ${getAlarmBadgeStyle(
            state.alarm_level
          )}`}
          title="KatS-Alarmstufe ändern"
        >
          {state.alarm_level > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
          <span>{state.alarm_title.toUpperCase()}</span>
        </button>
      </div>

      {/* Center: Live Telemetry Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-2 border transition-all ${
            telemetry.isConnected && telemetry.isLiveFeed
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
              : 'bg-red-950/80 text-red-300 border-red-600 animate-pulse'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              telemetry.isConnected && telemetry.isLiveFeed
                ? 'bg-emerald-400 animate-pulse-fast'
                : 'bg-red-400'
            }`}
          />
          <span>
            {telemetry.isConnected && telemetry.isLiveFeed
              ? `LIVE (${telemetry.lastPingMs > 0 ? `${telemetry.lastPingMs}ms` : '<1ms'})`
              : 'GETRENNT'}
          </span>
        </div>
      </div>

      {/* Right: Operational Clocks & Actions */}
      <div className="flex items-center gap-3">
        {/* City Selector */}
        {onChangeCity && telemetry.live && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 focus-within:border-slate-500 transition-colors">
            <span className="text-[10px] text-slate-400 font-mono">STADT:</span>
            <input
              key={telemetry.live.current_city}
              type="text"
              defaultValue={telemetry.live.current_city || 'Passau'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    onChangeCity(val);
                    e.currentTarget.blur();
                  }
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-bold outline-none w-32 placeholder-slate-600"
              placeholder="Stadt..."
              title="Stadt eingeben und Enter drücken"
            />
          </div>
        )}

        {/* Operational Clocks */}
        <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 mr-1">LOKAL</span>
            <strong className="text-slate-100 font-bold">{localString}</strong>
          </div>
          <div className="text-slate-700">|</div>
          <div>
            <span className="text-[10px] text-slate-500 mr-1">ZULU</span>
            <strong className="text-cyan-400 font-bold">{zuluString}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Widget Manager */}
          <button
            onClick={onOpenWidgetModal}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
            title="Widgets anpassen"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
            title={theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Leitstellen-Design'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
            title="Vollbild umschalten"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
