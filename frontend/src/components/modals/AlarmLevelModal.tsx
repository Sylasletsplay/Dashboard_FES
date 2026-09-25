import React from 'react';
import { X, AlertTriangle, ShieldCheck, Flame, Skull } from 'lucide-react';

interface AlarmLevelModalProps {
  isOpen: boolean;
  currentLevel: number;
  onClose: () => void;
  onSelectLevel: (level: number, title: string) => void;
}

export const AlarmLevelModal: React.FC<AlarmLevelModalProps> = ({
  isOpen,
  currentLevel,
  onClose,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  const levels = [
    {
      level: 0,
      title: 'Stufe 0 - Normalbetrieb',
      subtitle: 'Regulärer Dienstbetrieb, keine Großschadenslage.',
      icon: ShieldCheck,
      color: 'border-emerald-600 bg-emerald-950/50 text-emerald-200 hover:bg-emerald-900/60',
    },
    {
      level: 1,
      title: 'Stufe 1 - Vorwarnung / Bereitstellung',
      subtitle: 'Drohende Gefahrenlage (z.B. Starkwettervorhersage). Führungsstab tritt in Rufbereitschaft.',
      icon: AlertTriangle,
      color: 'border-amber-600 bg-amber-950/50 text-amber-200 hover:bg-amber-900/60',
    },
    {
      level: 2,
      title: 'Stufe 2 - Katastrophenvoralarm',
      subtitle: 'Akut anwachsende Großschadenslage. Technische Einsatzleitung (TEL) alarmiert.',
      icon: Flame,
      color: 'border-orange-600 bg-orange-950/50 text-orange-200 hover:bg-orange-900/60',
    },
    {
      level: 3,
      title: 'Stufe 3 - Katastrophenfall (Kat-Fall)',
      subtitle: 'Feststellung des Katastrophenfalls nach Art. 1 BayKSG / KatSG. Volle Befugnisse des Führungsstabs.',
      icon: Skull,
      color: 'border-red-600 bg-red-950/70 text-red-200 hover:bg-red-900/80 animate-pulse-fast',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 shadow-2xl text-slate-100 select-text">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg tracking-wide uppercase">Katastrophenschutz-Alarmstufe festlegen</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {levels.map(lvl => {
            const Icon = lvl.icon;
            const isCurrent = currentLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => {
                  onSelectLevel(lvl.level, lvl.title);
                  onClose();
                }}
                className={`w-full p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                  lvl.color
                } ${isCurrent ? 'ring-2 ring-white scale-[1.01]' : 'opacity-90 hover:opacity-100'}`}
              >
                <div className="p-2 rounded bg-slate-950/60 shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base uppercase tracking-wide font-mono">
                      {lvl.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[14px] bg-white/20 text-white font-mono px-2 py-0.5 rounded font-bold border border-white/30">
                        AKTIV
                      </span>
                    )}
                  </div>
                  <p className="text-[16px] text-slate-300 mt-1 leading-relaxed">
                    {lvl.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-base font-semibold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
