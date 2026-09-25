import React from 'react';
import { WidgetContainer } from '../components/WidgetContainer';
import { Flame, Info } from 'lucide-react';
import { LiveTelemetry } from '../types/dashboard';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface FireOperationsWidgetProps {
  telemetry: LiveTelemetry;
}

export const FireOperationsWidget: React.FC<FireOperationsWidgetProps> = ({ telemetry }) => {
  const hasData = telemetry.fire_missions_yesterday !== undefined;
  
  const emsColors = ['#18a1cd', '#1d81a2', '#00dca6', '#09bb9f', '#009076', '#475569', '#64748b'];
  
  let data: any[] = [];
  if (hasData) {
    if (telemetry.fire_missions_yesterday) {
      data.push({ name: 'Brandbekämpfung', value: telemetry.fire_missions_yesterday, color: '#c71e1d' }); // Exclusive Red
    }
    if (telemetry.mission_count_tech) {
      data.push({ name: 'Technische Hilfe', value: telemetry.mission_count_tech, color: '#fa8c00' });
    }
    
    if (telemetry.hauptbeschwerden && telemetry.hauptbeschwerden.length > 0) {
      telemetry.hauptbeschwerden.forEach((h, i) => {
        data.push({ ...h, color: emsColors[i % emsColors.length] });
      });
    } else if (telemetry.mission_count_ems) {
      data.push({ name: 'Rettungsdienst', value: telemetry.mission_count_ems, color: '#18a1cd' });
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top: Einsatzzahlen */}
      <WidgetContainer 
        title="Einsatzzahlen" 
        subtitle={telemetry.fire_data_date ? `Vortag (${telemetry.fire_data_date})` : 'Echtzeit'}
        icon={Flame} 
        iconColor="text-red-500"
        className="flex-none"
        contentClassName="flex flex-col justify-center items-center p-4"
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
                        className="transition-all duration-300 hover:opacity-80"
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
      </WidgetContainer>
    </div>
  );
};
