import React, { useState } from 'react';
import { WidgetProps } from '../types/widget';
import { ShieldAlert, Waves, CloudLightning, Power, Users, Edit2, Check, X } from 'lucide-react';

export const ThreatAssessmentWidget: React.FC<WidgetProps> = ({ state, sendEvent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(state.threat_assessment);

  // Sync state if external update arrives while not editing
  React.useEffect(() => {
    if (!isEditing) {
      setFormData(state.threat_assessment);
    }
  }, [state.threat_assessment, isEditing]);

  const handleSave = () => {
    sendEvent('UPDATE_THREATS', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(state.threat_assessment);
    setIsEditing(false);
  };

  // Compute personnel in deployment vs ready
  let totalPersonnel = 0;
  let deployedPersonnel = 0;
  state.units.forEach(u => {
    // strength formatted e.g. "1/2/3/6" -> total is the last number
    const parts = u.strength.split('/');
    const count = parseInt(parts[parts.length - 1], 10) || 0;
    totalPersonnel += count;
    if (u.status === 3 || u.status === 4) {
      deployedPersonnel += count;
    }
  });

  const activeIncidentsCount = state.incidents.filter(i => i.status !== 'Erledigt').length;

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm tracking-wide uppercase text-slate-100">S2 Lagebeurteilung & Gefahren</h3>
        </div>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold"
              >
                <Check className="w-3 h-3" /> Speichern
              </button>
              <button
                onClick={handleCancel}
                className="p-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
            >
              <Edit2 className="w-3 h-3" /> Einstufen
            </button>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
        {/* Key Operational Numbers */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase">Einsätze aktiv</span>
            <span className={`text-base font-bold font-mono ${activeIncidentsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeIncidentsCount}
            </span>
          </div>
          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase">Kräfte gesamt</span>
            <span className="text-base font-bold font-mono text-cyan-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-cyan-500" /> {totalPersonnel}
            </span>
          </div>
          <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase">Im Einsatz</span>
            <span className={`text-base font-bold font-mono ${deployedPersonnel > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
              {deployedPersonnel}
            </span>
          </div>
        </div>

        {/* Threat Items */}
        <div className="space-y-1.5 pt-1">
          {/* Hochwasser */}
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-1">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hochwasser / Pegel</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.hochwasser}
                onChange={e => setFormData({ ...formData, hochwasser: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            ) : (
              <p className="text-xs text-slate-300 font-mono">{state.threat_assessment.hochwasser}</p>
            )}
          </div>

          {/* Unwetter */}
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-300 mb-1">
              <CloudLightning className="w-3.5 h-3.5 text-yellow-400" />
              <span>Unwetter / Wetterlage</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.unwetter}
                onChange={e => setFormData({ ...formData, unwetter: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
              />
            ) : (
              <p className="text-xs text-slate-300 font-mono">{state.threat_assessment.unwetter}</p>
            )}
          </div>

          {/* KRITIS */}
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 mb-1">
              <Power className="w-3.5 h-3.5 text-purple-400" />
              <span>Kritische Infrastrukturen (KRITIS)</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.kritis}
                onChange={e => setFormData({ ...formData, kritis: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            ) : (
              <p className="text-xs text-slate-300 font-mono">{state.threat_assessment.kritis}</p>
            )}
          </div>

          {/* Lagebericht Notizen */}
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Lagebericht / Stabs-Notiz</span>
            {isEditing ? (
              <textarea
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-slate-500 resize-none"
              />
            ) : (
              <p className="text-xs text-slate-400 italic">{state.threat_assessment.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
