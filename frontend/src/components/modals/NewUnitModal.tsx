import React, { useState } from 'react';
import { X, Radio } from 'lucide-react';
import { FMSStatus } from '../../types/dashboard';

interface NewUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unitData: any) => void;
}

export const NewUnitModal: React.FC<NewUnitModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [callsign, setCallsign] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('Feuerwehr');
  const [status, setStatus] = useState<FMSStatus>(2);
  const [strength, setStrength] = useState('0/1/8/9');
  const [sector, setSector] = useState('Wache 1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim()) return;

    onSubmit({
      callsign: callsign.trim(),
      name: name.trim() || callsign.trim(),
      org,
      status,
      strength: strength.trim() || '0/0/0/0',
      sector: sector.trim() || 'Bereitstellung',
      location: [48.57 + (Math.random() - 0.5) * 0.02, 13.46 + (Math.random() - 0.5) * 0.02]
    });

    setCallsign('');
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-4 shadow-2xl text-slate-100 select-text">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm tracking-wide uppercase">Neue Einheit / Fahrzeug anlegen</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Funkrufname *</label>
              <input
                type="text"
                required
                placeholder="z.B. Florian 1/46-2"
                value={callsign}
                onChange={e => setCallsign(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Fahrzeugtyp</label>
              <input
                type="text"
                placeholder="z.B. LF 20 KatS"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Organisation</label>
              <select
                value={org}
                onChange={e => setOrg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Feuerwehr">Feuerwehr</option>
                <option value="THW">THW</option>
                <option value="Rettungsdienst">Rettungsdienst</option>
                <option value="DLRG">DLRG</option>
                <option value="KatS-Führungsstaffel">KatS-Führungsstaffel</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Initialer FMS Status</label>
              <select
                value={status}
                onChange={e => setStatus(Number(e.target.value) as FMSStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value={1}>1 - Frei Funk</option>
                <option value={2}>2 - Frei Wache</option>
                <option value={3}>3 - Einsatzfahrt</option>
                <option value={4}>4 - Am Einsatzort</option>
                <option value={5}>5 - Sprechwunsch</option>
                <option value={6}>6 - Nicht einsatzbereit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Stärke (KatS-Format)</label>
              <input
                type="text"
                placeholder="z.B. 0/1/8/9"
                value={strength}
                onChange={e => setStrength(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Abschnitt / Standort</label>
              <input
                type="text"
                placeholder="z.B. Bereitstellungsraum Süd"
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold transition-colors"
            >
              Einheit registrieren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
