import React from 'react';
import { WidgetProps } from '../types/widget';
import { Activity, Wifi, WifiOff, Server, Clock, Database, RefreshCw } from 'lucide-react';

export const FeedStatusWidget: React.FC<WidgetProps> = ({ telemetry, sendEvent }) => {
  const isLive = telemetry.isConnected && telemetry.isLiveFeed;

  const getLatencyColor = (ms: number) => {
    if (ms <= 0) return 'text-slate-400';
    if (ms < 30) return 'text-emerald-400';
    if (ms < 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
          <h3 className="font-bold text-lg tracking-wide uppercase text-slate-100">Datenstrom & Live-Telemetrie</h3>
        </div>
        <span className={`text-base px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1.5 ${
          isLive 
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
            : 'bg-red-950 text-red-300 border border-red-700'
        }`}>
          {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isLive ? 'LIVE TELEMETRIE' : 'OFFLINE / KEINE VERBINDUNG'}
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto custom-scroll">
        {/* Connection State Card */}
        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-base text-slate-400">
            <span>WebSocket Status</span>
            <Server className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="my-1">
            <span className={`text-xl font-bold font-mono ${isLive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isLive ? 'Verbunden' : 'Getrennt'}
            </span>
          </div>
          <div className="text-[16px] text-slate-500 font-mono">
            Ziel: {window.location.port === '5173' ? 'ws://127.0.0.1:8000/ws' : 'wss://dashboard-fes.onrender.com/ws'}
          </div>
        </div>

        {/* Latency Card */}
        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-base text-slate-400">
            <span>RTT Latenz</span>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="my-1 flex items-baseline gap-1">
            <span className={`text-3xl font-bold font-mono ${getLatencyColor(telemetry.lastPingMs)}`}>
              {telemetry.lastPingMs > 0 ? telemetry.lastPingMs : '--'}
            </span>
            <span className="text-base text-slate-500">ms</span>
          </div>
          <div className="text-[16px] text-slate-500">
            {telemetry.lastPingMs < 50 ? 'Echtzeit (Sehr gut)' : 'Akzeptabel'}
          </div>
        </div>

        {/* Events Counter */}
        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-base text-slate-400">
            <span>Empfangene Live-Events</span>
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="my-1">
            <span className="text-3xl font-bold font-mono text-cyan-400">
              {telemetry.eventsReceived}
            </span>
          </div>
          <div className="text-[16px] text-slate-500">
            In dieser Sitzung
          </div>
        </div>

        {/* Last Sync Timestamp */}
        <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-base text-slate-400">
            <span>Letzter Datenabgleich</span>
            <Database className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="my-1">
            <span className="text-lg font-semibold font-mono text-slate-200">
              {telemetry.lastUpdate ? telemetry.lastUpdate.toLocaleTimeString('de-DE') : 'Warten...'}
            </span>
          </div>
          <div className="text-[16px] text-slate-500">
            {isLive ? 'Aktuell synchronisiert' : 'Stand eingefroren'}
          </div>
        </div>
      </div>

      {/* Footer / Manual Ping button */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-base text-slate-400">
        <span>Clients online: <strong className="text-slate-200 font-mono">{telemetry.connectedClients}</strong></span>
        <button
          onClick={() => sendEvent('ping', { client_time: Date.now() })}
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[16px] transition-colors"
          title="Manuellen Ping senden"
        >
          <RefreshCw className="w-3 h-3" />
          Ping senden
        </button>
      </div>
    </div>
  );
};
