import React, { useState } from 'react';
import { WidgetProps } from '../types/widget';
import { Radio, Plus, Filter } from 'lucide-react';
import { FMSStatus } from '../types/dashboard';

interface UnitMatrixWidgetProps extends WidgetProps {
  onOpenNewUnit?: () => void;
}

export const UnitMatrixWidget: React.FC<UnitMatrixWidgetProps> = ({ state, sendEvent, onOpenNewUnit }) => {
  const [selectedOrg, setSelectedOrg] = useState<string>('ALLE');

  const orgs = ['ALLE', 'Feuerwehr', 'THW', 'Rettungsdienst', 'DLRG', 'KatS-Führungsstaffel'];

  const filteredUnits = state.units.filter(u => {
    if (selectedOrg === 'ALLE') return true;
    return u.org === selectedOrg;
  });

  const handleStatusChange = (unitId: string, newStatus: FMSStatus) => {
    sendEvent('UPDATE_UNIT_STATUS', {
      unit_id: unitId,
      status: newStatus
    });
  };

  const getStatusButtonClass = (buttonStatus: FMSStatus, currentStatus: FMSStatus) => {
    const isSelected = buttonStatus === currentStatus;
    const base = 'w-5 h-5 rounded text-[14px] font-mono font-bold flex items-center justify-center transition-all ';

    if (buttonStatus === 1) {
      return base + (isSelected ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 scale-105' : 'bg-slate-800 text-emerald-400 hover:bg-emerald-950');
    }
    if (buttonStatus === 2) {
      return base + (isSelected ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-400 scale-105' : 'bg-slate-800 text-sky-400 hover:bg-sky-950');
    }
    if (buttonStatus === 3) {
      return base + (isSelected ? 'bg-yellow-400 text-slate-950 ring-2 ring-yellow-300 scale-105' : 'bg-slate-800 text-yellow-400 hover:bg-yellow-950');
    }
    if (buttonStatus === 4) {
      return base + (isSelected ? 'bg-red-500 text-white ring-2 ring-red-400 scale-105' : 'bg-slate-800 text-red-400 hover:bg-red-950');
    }
    if (buttonStatus === 5) {
      return base + (isSelected ? 'bg-orange-500 text-white ring-2 ring-orange-400 scale-105' : 'bg-slate-800 text-orange-400 hover:bg-orange-950');
    }
    return base + (isSelected ? 'bg-slate-500 text-slate-950 ring-2 ring-slate-400 scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-lg tracking-wide uppercase text-slate-100">
            S3 Einheiten & FMS ({state.units.length})
          </h3>
        </div>
        {onOpenNewUnit && (
          <button
            onClick={onOpenNewUnit}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-base transition-colors"
          >
            <Plus className="w-3 h-3 text-cyan-400" /> Einheit
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 border-b border-slate-800/80 text-[16px] custom-scroll">
        <Filter className="w-3 h-3 text-slate-500 shrink-0" />
        {orgs.map(org => (
          <button
            key={org}
            onClick={() => setSelectedOrg(org)}
            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
              selectedOrg === org
                ? 'bg-slate-800 text-cyan-300 font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {org}
          </button>
        ))}
      </div>

      {/* Unit Rows Container */}
      <div className="flex-1 overflow-y-auto custom-scroll space-y-1.5 pr-1">
        {filteredUnits.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-base">
            Keine Einheiten für diesen Filter gefunden.
          </div>
        ) : (
          filteredUnits.map(unit => (
            <div
              key={unit.id}
              className="bg-slate-950/60 p-2 rounded border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
            >
              {/* Unit Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-base text-slate-100 truncate">
                    {unit.callsign}
                  </span>
                  <span className="text-[14px] text-slate-400 truncate">
                    ({unit.name})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[14px] text-slate-400 mt-0.5">
                  <span className="font-semibold text-slate-300">{unit.org}</span>
                  <span>•</span>
                  <span className="font-mono">{unit.strength}</span>
                  <span>•</span>
                  <span className="truncate">{unit.sector}</span>
                </div>
              </div>

              {/* FMS Buttons 1-6 */}
              <div className="flex items-center gap-1 shrink-0">
                {([1, 2, 3, 4, 5, 6] as FMSStatus[]).map(statusNum => (
                  <button
                    key={statusNum}
                    onClick={() => handleStatusChange(unit.id, statusNum)}
                    className={getStatusButtonClass(statusNum, unit.status)}
                    title={`FMS Status ${statusNum} zuweisen`}
                  >
                    {statusNum}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
