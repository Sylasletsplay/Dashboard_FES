import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface HistoryPoint {
  time: string;
  value: number;
}

interface RiverLevelChartProps {
  data?: HistoryPoint[];
  hw1?: number; // Meldestufe 1 threshold
  theme?: 'dark' | 'light';
}

export const RiverLevelChart: React.FC<RiverLevelChartProps> = ({ data, hw1, theme = 'dark' }) => {
  if (!data || data.length === 0) return null;

  // Calculate dynamic domain to keep the chart focused (Scientific graphing: focus on data variation)
  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const yMin = Math.max(0, minVal - 10);
  const yMax = Math.max(maxVal + 10, hw1 ? hw1 + 10 : maxVal + 10);

  const isLight = theme === 'light';

  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          {/* Scientific Graphing: Minimal, faint grid lines to guide the eye without clutter */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? "#e2e8f0" : "#334155"} opacity={0.4} />
          
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 9, fill: isLight ? '#475569' : '#64748b' }} 
            tickLine={false}
            axisLine={false}
            minTickGap={20}
            tickFormatter={(val: any) => {
              try {
                if (!val) return '';
                const d = new Date(val);
                return isNaN(d.getTime()) ? String(val) : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
              } catch (e) {
                return String(val);
              }
            }}
          />
          <YAxis 
            domain={[yMin, yMax]} 
            tick={{ fontSize: 9, fill: isLight ? '#475569' : '#64748b' }} 
            tickLine={false}
            axisLine={false}
          />
          
          {/* Scientific Graphing: Clean, readable tooltip without distracting backgrounds */}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isLight ? '#ffffff' : '#0f172a', 
              borderColor: isLight ? '#cbd5e1' : '#334155', 
              color: isLight ? '#0f172a' : '#f8fafc',
              fontSize: '11px', 
              borderRadius: '4px' 
            }}
            itemStyle={{ color: '#38bdf8' }}
            labelStyle={{ color: isLight ? '#475569' : '#94a3b8' }}
            labelFormatter={(label: any) => {
              try {
                if (!label) return '';
                const d = new Date(label);
                return isNaN(d.getTime()) ? String(label) : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
              } catch (e) {
                return String(label);
              }
            }}
          />

          {/* Contextual Reference Line for danger threshold */}
          {hw1 && (
            <ReferenceLine 
              y={hw1} 
              stroke="#fbbf24" 
              strokeDasharray="4 4" 
              label={{ position: 'insideTopLeft', value: 'M1', fill: '#fbbf24', fontSize: 9 }}
            />
          )}

          {/* Data Line: High contrast, thick enough to be easily readable, no confusing smooth curve (monotone) unless physically accurate. Linear shows the actual readings better. */}
          <Line 
            name="Pegelstand (cm)"
            type="linear" 
            dataKey="value" 
            stroke="#38bdf8" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#38bdf8' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
