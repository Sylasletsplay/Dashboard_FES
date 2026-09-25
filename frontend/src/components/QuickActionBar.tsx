import React from 'react';
import { AlertTriangle, Sliders, RotateCcw } from 'lucide-react';
import { KatSState } from '../types/dashboard';

interface QuickActionBarProps {
  state: KatSState;
  onOpenAlarmModal: () => void;
  onOpenWidgetModal: () => void;
  onResetState: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  state,
  onOpenAlarmModal,
  onOpenWidgetModal,
  onResetState,
}) => {
  const activeIncidentsCount = state.incidents.filter(i => i.status !== 'Erledigt').length;

  return (
    <footer className="h-10 bg-slate-950 border-t border-slate-800 px-3 flex items-center justify-between shrink-0 select-none text-xs">
      {/* Left: Quick Action Status Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAlarmModal}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded font-semibold transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Stufe ändern</span>
        </button>
      </div>

      {/* Right: Management Actions & Reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenWidgetModal}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Widgets anpassen</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm('Möchten Sie das Stabs-Lagebild wirklich auf den Normalbetrieb (Standard) zurücksetzen?')) {
              onResetState();
            }
          }}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors"
          title="Lagebild auf Standard-Normalbetrieb zurücksetzen"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Zurücksetzen</span>
        </button>
      </div>
    </footer>
  );
};
