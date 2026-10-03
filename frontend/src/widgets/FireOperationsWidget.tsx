import React from 'react';
import { WidgetContainer } from '../components/WidgetContainer';
import { RefreshButton } from '../components/RefreshButton';
import { Flame, Info, AlertTriangle } from 'lucide-react';
import { LiveTelemetry, RefreshStatus } from '../types/dashboard';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface FireOperationsWidgetProps {
  telemetry: LiveTelemetry;
  error?: string | null;
  onRefresh?: () => void;
  refreshStatus?: RefreshStatus;
}

export const FireOperationsWidget: React.FC<FireOperationsWidgetProps> = ({ telemetry, error, onRefresh, refreshStatus }) => {
  const hasData = telemetry.fire_missions_yesterday !== undefined;
  
  const emsColors = ['#5d8aa8', '#4f7396', '#6b88a8', '#3d5a80', '#546a86', '#475569', '#64748b'];
  
  let data: any[] = [];
  if (hasData) {
    if (telemetry.fire_missions_yesterday) {
      data.push({ name: 'Brandbekämpfung', value: telemetry.fire_missions_yesterday, color: '#c71e1d' }); // Exclusive Red
    }
    if (telemetry.mission_count_tech) {
      data.push({ name: 'Technische Hilfe', value: telemetry.mission_count_tech, color: '#a16207' });
    }
    
    if (telemetry.hauptbeschwerden && telemetry.hauptbeschwerden.length > 0) {
      telemetry.hauptbeschwerden.forEach((h, i) => {
        data.push({ ...h, color: emsColors[i % emsColors.length] });
      });
    } else if (telemetry.mission_count_ems) {
      data.push({ name: 'Rettungsdienst', value: telemetry.mission_count_ems, color: '#35618f' });
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {error && (
        <div className="bg-red-950/30 border border-red-800 text-red-300 p-3 rounded-lg flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      {/* Top: Einsatzzahlen */}
      <WidgetContainer 
        title="Einsatzzahlen" 
        subtitle={telemetry.fire_data_date ? `Vortag (${telemetry.fire_data_date})` : 'Echtzeit'}
        icon={Flame} 
        iconColor="text-red-500"
        className="flex-none"
        contentClassName="flex flex-col justify-center items-center p-4"
        headerRight={
          onRefresh && <RefreshButton onClick={onRefresh} status={refreshStatus} />
        }
      >
        {hasData ? (
          <>
            <span className="text-[16px] font-bold text-slate-500 uppercase tracking-widest mb-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full">
              Gesamt Einsätze
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black font-mono text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                {telemetry.mission_count_all || 0}
              </span>
            </div>
          </>
        ) : (
          <div className="text-slate-500">Lade Einsatzdaten...</div>
        )}
      </WidgetContainer>

      {/* Bottom: Einsatzspektrum */}
      <WidgetContainer 
        title="Einsatzspektrum" 
        subtitle="Berliner Feuerwehr"
        icon={Flame} 
        iconColor="text-orange-500"
        className="flex-1"
        contentClassName="flex flex-col p-0 overflow-hidden"
      >
        {hasData && data.length > 0 ? (
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={data}
                dataKey="value"
                aspectRatio={4/3}
                isAnimationActive={false}
                stroke="none"
                content={(props: any) => {
                  const { x, y, width, height, value, name, color, payload } = props;
                  if (!width || !height || width < 0 || height < 0) return <g></g>;
                  
                  // Decide if we show label based on box size
                  const showLabel = width > 40 && height > 30;
                  const labelName = name || payload?.name || '';
                  
                  // Recharts spreads custom data properties directly onto the node props
                  const nodeColor = color || payload?.color || '#334155';
                  
                  return (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={nodeColor}
                        stroke="#0f172a"
                        strokeWidth={2}
                        className="hover:opacity-80 transition-opacity duration-200"
                      />
                      {showLabel && (
                        <foreignObject x={x} y={y} width={width} height={height} className="pointer-events-none">
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 overflow-hidden">
                            <span 
                              className="text-[13px] font-bold text-white drop-shadow-md leading-tight break-words max-w-full"
                              title={labelName}
                            >
                              {labelName}
                            </span>
                            <span className="text-[12px] font-black font-mono text-white drop-shadow-md mt-0.5">
                              {value}
                            </span>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                }}
              >
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.5rem', fontSize: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => [`${value} Einsätze`, undefined]}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-500">
            Lade Spektrum...
          </div>
        )}
        <div className="w-full shrink-0 h-10 flex flex-col justify-center px-3 border-t border-slate-200 dark:border-slate-800/60">
          <a
            href="https://github.com/Berliner-Feuerwehr/BF-Open-Data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] leading-tight text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline"
          >
            © Berliner Feuerwehr (CC BY 4.0) – BFw Mission Data
          </a>
          <p className="text-[10px] leading-tight text-slate-400/80">
            BFw Mission Data, Berliner Feuerwehr, Berlin
          </p>
        </div>
      </WidgetContainer>
    </div>
  );
};
