import React from 'react';
import { RefreshCcw, Check, Clock, AlertTriangle } from 'lucide-react';
import { RefreshStatus } from '../types/dashboard';

interface RefreshButtonProps {
  onClick: () => void;
  status?: RefreshStatus;
}

// Widget header refresh button with feedback: spins while the server fetches,
// then briefly shows whether the refresh worked, was throttled, or failed.
export const RefreshButton: React.FC<RefreshButtonProps> = ({ onClick, status }) => {
  const state = status?.status;
  const loading = state === 'loading';

  let label: React.ReactNode = null;
  if (state === 'ok') {
    label = <span className="flex items-center gap-1 text-emerald-500"><Check className="w-3.5 h-3.5" />Aktualisiert</span>;
  } else if (state === 'cooldown') {
    label = <span className="flex items-center gap-1 text-amber-500"><Clock className="w-3.5 h-3.5" />Bitte warten{status?.retryIn ? ` (${status.retryIn}s)` : ''}</span>;
  } else if (state === 'error') {
    label = <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-3.5 h-3.5" />Fehlgeschlagen</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs font-medium">{label}</span>}
      <button
        onClick={onClick}
        disabled={loading}
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-500 active:scale-90 disabled:cursor-wait"
        title={loading ? 'Wird aktualisiert...' : 'Aktualisieren'}
      >
        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
      </button>
    </div>
  );
};
