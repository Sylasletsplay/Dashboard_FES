import React, { useState, useMemo } from 'react';
import { WidgetContainer } from '../components/WidgetContainer';
import { Waves, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { RiverLevelChart } from '../components/charts/RiverLevelChart';
import { WaterLevelReading } from '../types/dashboard';

interface WaterLevelWidgetProps {
  waterLevels: WaterLevelReading[];
  theme?: any;
}

export const WaterLevelWidget: React.FC<WaterLevelWidgetProps> = ({ waterLevels, theme }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');

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
      contentClassName="flex flex-col gap-3 overflow-y-auto custom-scroll"
    >
      <div className="flex flex-col gap-2 mb-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Pegel suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
          >
            <option value="ALL">Alle Pegel anzeigen</option>
            <option value="LT_NNW">&lt; NNW (Extrem Niedrig)</option>
            <option value="LT_MNW">&lt; MNW (Niedrigwasser)</option>
            <option value="GT_MW">&gt; MW (Überdurchschnittlich)</option>
            <option value="GT_MHW">&gt; MHW (Hochwasser)</option>
            <option value="GT_HHW">&gt; HHW (Extrem Hochwasser)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
        {filteredLevels.length > 0 ? (
          filteredLevels.map((pegel, idx) => {
            const isExpanded = !!expanded[pegel.station];
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shrink-0">
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => toggleExpand(pegel.station)}
                >
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{pegel.station}</span>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-xl font-bold text-cyan-600 dark:text-cyan-300">
                      {pegel.level_cm}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">cm</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono">
                    {getTrendIcon(pegel.trend)}
                    <span className="text-slate-700 dark:text-slate-300">{pegel.delta_1h}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 pb-2">
                     <RiverLevelChart data={pegel.history} hw1={pegel.max_normal} theme={theme} />
                     
                     {/* Show characteristic values for reference if available */}
                     {pegel.char_vals && Object.keys(pegel.char_vals).length > 0 && (
                       <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded">
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
          <div className="flex-1 flex items-center justify-center text-slate-500 p-4 text-sm text-center">
            Keine Pegel gefunden, die den Filterkriterien entsprechen.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};
