import React from 'react';
import { WidgetProps } from '../types/widget';
import { AlertCircle, Plus, CheckCircle, Clock, Check, ArrowRight } from 'lucide-react';
import { Incident } from '../types/dashboard';

interface IncidentsWidgetProps extends WidgetProps {}

export const IncidentsWidget: React.FC<IncidentsWidgetProps> = ({ state, sendEvent }) => {
  const activeIncidents = [...state.incidents]
    .filter(i => i.status !== 'Erledigt')
    .sort((a, b) => a.priority - b.priority);

  const completedIncidentsCount = state.incidents.filter(i => i.status === 'Erledigt').length;

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

  const getPriorityBadge = (prio: number) => {
    if (prio === 1) {
      return <span className="px-1.5 py-0.5 text-[14px] font-bold bg-red-950 text-red-300 border border-red-700 rounded">PRIO 1</span>;
    }
    if (prio === 2) {
      return <span className="px-1.5 py-0.5 text-[14px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-700 rounded">PRIO 2</span>;
    }
    return <span className="px-1.5 py-0.5 text-[14px] font-bold bg-blue-950 text-blue-300 border border-blue-700 rounded">PRIO 3</span>;
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'Gemeldet':
        return <span className="text-[14px] text-amber-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Gemeldet</span>;
      case 'In Bearbeitung':
        return <span className="text-[14px] text-cyan-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> In Bearbeitung</span>;
      case 'Unter Kontrolle':
        return <span className="text-[14px] text-emerald-400 flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Unter Kontrolle</span>;
      default:
        return <span className="text-[14px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${activeIncidents.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
          <h3 className="font-bold text-lg tracking-wide uppercase text-slate-100">
            S3 Einsatzstellen ({activeIncidents.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {completedIncidentsCount > 0 && (
            <span className="text-[16px] text-slate-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> {completedIncidentsCount} erledigt
            </span>
          )}
        </div>
      </div>

      {/* Incidents List Container */}
      <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
        {activeIncidents.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-lg">
            <CheckCircle className="w-8 h-8 text-emerald-500/60 mb-2" />
            <p className="text-base font-semibold text-slate-300">Keine aktiven Einsatzstellen</p>
            <p className="text-[16px] text-slate-500 mt-1 max-w-[200px]">
              Der Führungsstab befindet sich im Normalbetrieb oder in Bereitschaft.
            </p>
          </div>
        ) : (
          activeIncidents.map(inc => (
            <div
              key={inc.id}
              className="bg-slate-950/70 p-2.5 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-base text-cyan-400">#{inc.id}</span>
                    {getPriorityBadge(inc.priority)}
                    <span className="text-[16px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                      {inc.sector}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100">{inc.title}</h4>
                  {inc.description && (
                    <p className="text-[16px] text-slate-400 mt-0.5 line-clamp-2">{inc.description}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {getStatusBadge(inc.status)}
                  <button
                    onClick={() => handleAdvanceStatus(inc)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[14px] font-semibold transition-colors"
                    title="Status weiterschalten"
                  >
                    <span>Weiter</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Footer info: assigned units */}
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[14px] text-slate-400 font-mono">
                <span>Einheiten: {inc.assigned_units.length > 0 ? inc.assigned_units.join(', ') : 'Keine zugeteilt'}</span>
                <span>{inc.created_at ? inc.created_at.split(' ')[1] : ''}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
