import React, { useState, useMemo } from 'react';
import { WidgetContainer } from '../components/WidgetContainer';
import { Waves, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Search, Filter, AlertTriangle, RefreshCcw, Timer } from 'lucide-react';
import { RiverLevelChart } from '../components/charts/RiverLevelChart';
import { WaterLevelReading } from '../types/dashboard';

interface WaterLevelWidgetProps {
  waterLevels: WaterLevelReading[];
  theme?: any;
  error?: string | null;
  onRefresh?: () => void;
}

const TREND_WINDOWS = ['1', '3', '6', '12', '24'];

const trendFromDelta = (deltaStr: string) => {
  const n = parseFloat(deltaStr);
  if (isNaN(n)) return 'gleichbleibend';
  if (n > 0.5) return 'steigend';
  if (n < -0.5) return 'fallend';
  return 'gleichbleibend';
};

export const WaterLevelWidget: React.FC<WaterLevelWidgetProps> = ({ waterLevels, theme, error, onRefresh }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [trendWindow, setTrendWindow] = useState<string>(() => {
    const saved = localStorage.getItem('pegel_trend_window') || '3';
    return TREND_WINDOWS.includes(saved) ? saved : '3';
  });

  const changeTrendWindow = (w: string) => {
    setTrendWindow(w);
    localStorage.setItem('pegel_trend_window', w);
  };

  const toggleExpand = (station: string) => {
    setExpanded(prev => ({ ...prev, [station]: !prev[station] }));
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'steigend') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'fallend') return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const filteredLevels = useMemo(() => {
    return waterLevels.filter(pegel => {
      // Name filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!pegel.station.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Characteristic Values filter
      if (filterMode !== 'ALL') {
        const cv = pegel.char_vals || {};
        const level = pegel.level_cm;
        
        switch (filterMode) {
          case 'LT_NNW': // < NNW (Niedrigster Niedrigwasserstand)
            if (!cv['NNW'] || level >= cv['NNW']) return false;
            break;
          case 'LT_MNW': // < MNW (Mittleres Niedrigwasser)
            if (!cv['MNW'] || level >= cv['MNW']) return false;
            break;
          case 'GT_MW': // > MW (Mittlerer Wasserstand)
            if (!cv['MW'] || level <= cv['MW']) return false;
            break;
          case 'GT_MHW': // > MHW (Mittleres Hochwasser)
            if (!cv['MHW'] || level <= cv['MHW']) return false;
            break;
          case 'GT_HHW': // > HHW (Höchstes Hochwasser)
            if (!cv['HHW'] || level <= cv['HHW']) return false;
            break;
        }
      }

      return true;
    });
  }, [waterLevels, searchQuery, filterMode]);

  return (
    <WidgetContainer 
      title="Wasserstände Berlin" 
      icon={Waves} 
      iconColor="text-cyan-500"
      className="h-full"
      contentClassName="flex flex-col gap-2"
      headerRight={
        onRefresh && (
          <button onClick={onRefresh} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-500" title="Aktualisieren">
            <RefreshCcw className="w-4 h-4" />
          </button>
        )
      }
    >
      {error && (
        <div className="bg-red-950/30 border border-red-800 text-red-300 p-3 rounded-lg flex items-center gap-2 mb-1 shrink-0">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Pegel suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Level filter (compact, custom chevron) */}
          <div className="relative flex-1 min-w-0">
            <Filter className="w-3.5 h-3.5 text-cyan-500/70 dark:text-cyan-400/70 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              className="w-full appearance-none bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-8 pr-7 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer transition-colors hover:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
              value={filterMode}
              onChange={e => setFilterMode(e.target.value)}
            >
              <option value="ALL">Alle Pegel</option>
              <option value="LT_NNW">&lt; NNW (Extrem Niedrig)</option>
              <option value="LT_MNW">&lt; MNW (Niedrigwasser)</option>
              <option value="GT_MW">&gt; MW (Überdurchschnittlich)</option>
              <option value="GT_MHW">&gt; MHW (Hochwasser)</option>
              <option value="GT_HHW">&gt; HHW (Extrem Hochwasser)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Trend time-window: segmented pill control */}
          <div
            className="shrink-0 flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg"
            title="Zeitraum für Trend-Berechnung"
          >
            <Timer className="w-3.5 h-3.5 text-cyan-500/70 dark:text-cyan-400/70" />
            <div className="flex items-center gap-0.5">
              {TREND_WINDOWS.map(w => {
                const active = trendWindow === w;
                return (
                  <button
                    key={w}
                    onClick={() => changeTrendWindow(w)}
                    className={`px-1.5 py-0.5 rounded-md text-xs font-semibold font-mono leading-none transition-all duration-150 ${
                      active
                        ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {w}
                    <span className={active ? 'text-cyan-100' : 'text-slate-400/70 dark:text-slate-500'}>h</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto custom-scroll">
        {filteredLevels.length > 0 ? (
          filteredLevels.map((pegel, idx) => {
            const isExpanded = !!expanded[pegel.station];
            const winDelta = pegel.trend_map?.[trendWindow] ?? pegel.delta_3h;
            const winTrend = pegel.trend_map ? trendFromDelta(winDelta) : pegel.trend;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shrink-0">
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => toggleExpand(pegel.station)}
                >
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{pegel.station}</span>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-bold text-cyan-600 dark:text-cyan-300">
                      {pegel.level_cm}
                    </span>
                    <span className="text-base text-slate-500 dark:text-slate-400">cm</span>
                  </div>
                    <div className="flex items-center gap-1 text-base font-mono">
                      {getTrendIcon(winTrend)}
                      <span className="text-slate-700 dark:text-slate-300">{winDelta}</span>
                      <span className="text-[13px] text-slate-400 dark:text-slate-500">/ {trendWindow}h</span>
                    </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 pb-2">
                     <RiverLevelChart data={pegel.history} hw1={pegel.max_normal} theme={theme} />
                     
                     {/* Show characteristic values for reference if available */}
                     {pegel.char_vals && Object.keys(pegel.char_vals).length > 0 && (
                       <div className="mt-3 grid grid-cols-3 gap-1 text-[14px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded">
                          {pegel.char_vals['NNW'] && <div>NNW: {pegel.char_vals['NNW']}</div>}
                          {pegel.char_vals['MNW'] && <div>MNW: {pegel.char_vals['MNW']}</div>}
                          {pegel.char_vals['MW'] && <div>MW: {pegel.char_vals['MW']}</div>}
                          {pegel.char_vals['MHW'] && <div>MHW: {pegel.char_vals['MHW']}</div>}
                          {pegel.char_vals['HHW'] && <div>HHW: {pegel.char_vals['HHW']}</div>}
                       </div>
                     )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 p-4 text-lg text-center">
            Keine Pegel gefunden, die den Filterkriterien entsprechen.
          </div>
        )}
      </div>

      <div className="shrink-0 h-10 flex flex-col justify-center px-3 border-t border-slate-200 dark:border-slate-800/60">
        <a
          href="https://pegelonline.wsv.de/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] leading-tight text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
        >
          © WSV (Wasserstraßen- und Schifffahrtsverwaltung) – Pegelonline
        </a>
        <p className="text-[10px] leading-tight text-slate-400/80">
          Pegeldaten der Wasserstraßen- und Schifffahrtsverwaltung
        </p>
      </div>
    </WidgetContainer>
  );
};
