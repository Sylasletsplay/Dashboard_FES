import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incidentData: any) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [sector, setSector] = useState('Einsatzabschnitt 1');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('48.573');
  const [lng, setLng] = useState('13.461');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      priority,
      sector,
      description: description.trim(),
      status: 'Gemeldet',
      location: [parseFloat(lat) || 48.573, parseFloat(lng) || 13.461],
      assigned_units: []
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-5 shadow-2xl text-slate-100 select-text">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-lg tracking-wide uppercase">Neue Einsatzstelle erfassen</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-base">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Stichwort / Einsatzgrund *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="z.B. Deichsicherung Donauufer oder Stromausfall"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 text-lg focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Priorität</label>
              <select
                value={priority}
                onChange={e => setPriority(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-red-500 focus:outline-none"
              >
                <option value={1}>Prio 1 (Höchste / Lebensgefahr)</option>
                <option value={2}>Prio 2 (Dringlich)</option>
                <option value={3}>Prio 3 (Normal / Folge)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Einsatzabschnitt</label>
              <input
                type="text"
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Koordinate (Lat)</label>
              <input
                type="text"
                value={lat}
                onChange={e => setLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-base focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Koordinate (Lng)</label>
              <input
                type="text"
                value={lng}
                onChange={e => setLng(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-base focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Lagebeschreibung / Maßnahmen</label>
            <textarea
              rows={3}
              placeholder="Schadensausmaß, erste getroffene Maßnahmen..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors shadow"
            >
              Einsatzstelle anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
