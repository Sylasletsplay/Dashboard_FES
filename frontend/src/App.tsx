import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { DisconnectBanner } from './components/DisconnectBanner';
import { WaterLevelWidget } from './widgets/WaterLevelWidget';
import { FireOperationsWidget } from './widgets/FireOperationsWidget';
import { WeatherWidget } from './widgets/WeatherWidget';

export function App() {
  const { state, telemetry, sendEvent } = useWebSocket();
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  React.useEffect(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const isLive = telemetry.isConnected && telemetry.isLiveFeed;
  const liveData = telemetry.live || {
    water_levels: [],
    weather: { temperature_c: 0, wind_speed_kmh: 0, wind_gusts_kmh: 0, wind_direction: '--', precipitation_mm: 0, air_pressure_hpa: 0, warning_level: 0, warning_text: 'Keine Daten' },
    kritis: { power_grid: { status: '', label: '', load_percent: 0 }, water_supply: { status: '', label: '', pressure_bar: 0 }, communication: { status: '', label: '', redundancy: '' } }
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${
      theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Offline / Disconnect Alert Banner */}
      <DisconnectBanner telemetry={telemetry} />

      {/* Header */}
      <div className="flex-none p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold font-mono text-slate-100 uppercase tracking-widest">
            KatS-Dashboard <span className="text-cyan-400">Berlin</span>
          </h1>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2 text-lg text-slate-400">
             <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
             {isLive ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
        <div className="text-lg font-mono text-slate-400">
           Stand: {telemetry.lastUpdate ? telemetry.lastUpdate.toLocaleTimeString('de-DE') : '--:--:--'}
        </div>
      </div>

      {/* Main Area: 3 Columns Grid */}
      <main className="flex-1 min-h-0 w-full p-4 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-4 overflow-hidden">
          
          {/* Left Column: Water Levels */}
          <div className="col-span-1 h-full min-h-0 overflow-hidden">
            <WaterLevelWidget 
              waterLevels={liveData.water_levels} 
              theme={theme} 
              error={liveData.water_levels_error}
              onRefresh={() => sendEvent('REFRESH_TELEMETRY', { widget: 'pegel' })}
            />
          </div>

          {/* Middle Column: Fire Operations */}
          <div className="col-span-1 h-full min-h-0 overflow-hidden">
             <FireOperationsWidget 
               telemetry={liveData} 
               error={liveData.fire_data_error}
               onRefresh={() => sendEvent('REFRESH_TELEMETRY', { widget: 'fire' })}
             />
          </div>

          {/* Right Column: Weather */}
          <div className="col-span-1 h-full min-h-0 overflow-hidden">
             <WeatherWidget 
               telemetry={liveData} 
               error={liveData.weather?.error}
               onRefresh={() => sendEvent('REFRESH_TELEMETRY', { widget: 'weather' })}
             />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
