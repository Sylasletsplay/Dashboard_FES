import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { TelemetryState } from '../types/dashboard';

interface DisconnectBannerProps {
  telemetry: TelemetryState;
}

export const DisconnectBanner: React.FC<DisconnectBannerProps> = ({ telemetry }) => {
  if (telemetry.isConnected && telemetry.isLiveFeed) {
    return null;
  }

  return (
    <div className="w-full bg-red-600 text-white px-4 py-1.5 flex items-center justify-between text-base font-bold tracking-wide uppercase shadow-lg z-50 animate-pulse-fast select-none">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <AlertTriangle className="w-4 h-4" />
        <span>Achtung: Keine Live-Verbindung zum KatS-Server! Das Lagebild wird nicht aktualisiert.</span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[16px]">
        <span>Status: GETRENNT</span>
        <span className="bg-red-800 px-2 py-0.5 rounded border border-red-400">
          Automatischer Reconnect...
        </span>
      </div>
    </div>
  );
};
