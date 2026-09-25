import React from 'react';
import { X, Sliders, CheckSquare, Square, PlusCircle } from 'lucide-react';
import { getWidgets } from '../../widgets/registry';

interface WidgetManagerModalProps {
  isOpen: boolean;
  visibleWidgetIds: string[];
  onToggleWidget: (id: string) => void;
  onClose: () => void;
}

export const WidgetManagerModal: React.FC<WidgetManagerModalProps> = ({
  isOpen,
  visibleWidgetIds,
  onToggleWidget,
  onClose,
}) => {
  if (!isOpen) return null;

  const allWidgets = getWidgets();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 shadow-2xl text-slate-100 select-text">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-lg tracking-wide uppercase">Stabs-Widgets verwalten</h3>
              <p className="text-[16px] text-slate-400">
                Wählen Sie die im Lagebild aktiven Module aus.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Registered Widgets */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
          {allWidgets.map(widget => {
            const isVisible = visibleWidgetIds.includes(widget.id);
            return (
              <div
                key={widget.id}
                onClick={() => onToggleWidget(widget.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isVisible
                    ? 'bg-slate-950 border-cyan-700/80 text-slate-100'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button className="text-cyan-400">
                    {isVisible ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{widget.title}</span>
                      <span className="text-[13px] font-mono bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded border border-slate-700">
                        {widget.category}
                      </span>
                    </div>
                    <p className="text-[16px] text-slate-400 mt-0.5">{widget.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Developer / Extensibility hint */}
        <div className="mt-4 p-2.5 bg-slate-950/70 border border-slate-800 rounded text-[16px] text-slate-400 flex items-start gap-2">
          <PlusCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Erweiterbarkeit:</strong> Neue Widgets können in <code className="text-cyan-300 font-mono">src/widgets/</code> erstellt und mit einem Befehl in <code className="text-cyan-300 font-mono">registry.ts</code> registriert werden. Sie stehen dem Führungsstab sofort zur Verfügung.
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded text-base transition-colors"
          >
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
