import React, { useState } from 'react';
import { WidgetProps } from '../types/widget';
import { AlertCircle, Plus, Clock, CheckCircle2, ArrowRight, Trash2, MapPin } from 'lucide-react';
import { Incident, KatSState } from '../types/dashboard';

interface CurrentIncidentsPanelProps {
  state: KatSState;
  telemetry: any;
  sendEvent: (type: string, payload?: any) => void;
  theme?: 'dark' | 'light';
}

export const CurrentIncidentsPanel: React.FC<CurrentIncidentsPanelProps> = ({
  state,
  sendEvent,
  theme = 'dark'
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PRIO1' | 'ACTIVE'>('ALL');

  const allIncidents = state.incidents || [];
  const activeIncidents = allIncidents.filter(i => i.status !== 'Erledigt');

  const filteredIncidents = activeIncidents.filter(inc => {
    if (filter === 'PRIO1') return inc.priority === 1;
    if (filter === 'ACTIVE') return inc.status === 'In Bearbeitung';
    return true;
  }).sort((a, b) => a.priority - b.priority);

  const completedCount = allIncidents.filter(i => i.status === 'Erledigt').length;

  const handleAdvanceStatus = (inc: Incident) => {
    let nextStatus: Incident['status'] = 'In Bearbeitung';
    if (inc.status === 'Gemeldet') nextStatus = 'In Bearbeitung';
    else if (inc.status === 'In Bearbeitung') nextStatus = 'Unter Kontrolle';
    else if (inc.status === 'Unter Kontrolle') nextStatus = 'Erledigt';

    sendEvent('UPDATE_INCIDENT', {
      id: inc.id,
      updates: { status: nextStatus }
    });
  };

  const handleDeleteIncident = (id: string) => {
    if (window.confirm(`Einsatz #${id} wirklich löschen / abschließen?`)) {
      sendEvent('UPDATE_INCIDENT', {
        id,
        updates: { status: 'Erledigt' }
      });
    }
  };

  const getPriorityStyle = (prio: number) => {
    if (prio === 1) return 'bg-red-950 text-red-300 border-red-700 font-extrabold';
    if (prio === 2) return 'bg-amber-950 text-amber-300 border-amber-700 font-bold';
    return 'bg-blue-950 text-blue-300 border-blue-700 font-semibold';
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'Gemeldet':
        return <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Gemeldet</span>;
      case 'In Bearbeitung':
        return <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> In Bearbeitung</span>;
      case 'Unter Kontrolle':
        return <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Unter Kontrolle</span>;
      default:
        return <span className="text-[11px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col kats-panel rounded-lg p-3 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${activeIncidents.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
          <h3 className="font-bold text-xs uppercase tracking-wider font-mono">
            Aktuelle Einsätze ({activeIncidents.length})
          </h3>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 pb-2 mb-1 text-[11px] border-b border-slate-800/50">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-2 py-0.5 rounded transition-colors ${
            filter === 'ALL' ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Alle ({activeIncidents.length})
        </button>
        <button
          onClick={() => setFilter('PRIO1')}
          className={`px-2 py-0.5 rounded transition-colors ${
            filter === 'PRIO1' ? 'bg-red-950 text-red-300 font-bold border border-red-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Prio 1 ({activeIncidents.filter(i => i.priority === 1).length})
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-2 py-0.5 rounded transition-colors ${
            filter === 'ACTIVE' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          In Bearbeitung
        </button>
        {completedCount > 0 && (
          <span className="ml-auto text-[10px] text-slate-500 font-mono">
            {completedCount} beendet
          </span>
        )}
      </div>

      {/* Incidents List Container */}
      <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
        {filteredIncidents.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-2" />
            <p className="text-xs font-bold text-slate-200">Keine aktiven Einsätze vorhanden</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              Die Lage ist ruhig. Alle erfassten Vorgänge wurden erfolgreich abgeschlossen.
            </p>
          </div>
        ) : (
          filteredIncidents.map(inc => (
            <div
              key={inc.id}
              className="kats-panel-sub p-2.5 rounded-lg border hover:border-slate-600 transition-all flex flex-col gap-2"
            >
              {/* Card Header: ID, Prio, Sector, Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs text-cyan-400">
                    #{inc.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${getPriorityStyle(inc.priority)}`}>
                    PRIO {inc.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-slate-500" />
                    {inc.sector}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {inc.created_at ? inc.created_at.split(' ')[1] || inc.created_at : ''}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-100 leading-snug">
                  {inc.title}
                </h4>
                {inc.description && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>
                )}
              </div>

              {/* Status & Quick Action Controls */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                <div>
                  {getStatusBadge(inc.status)}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdvanceStatus(inc)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold transition-colors"
                    title="Status weiterschalten"
                  >
                    <span>Status weiter</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => handleDeleteIncident(inc.id)}
                    className="p-1 bg-slate-800/80 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded transition-colors"
                    title="Einsatz abschließen / löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
