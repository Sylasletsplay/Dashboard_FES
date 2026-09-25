import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

interface NewLogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logData: any) => void;
}

export const NewLogEntryModal: React.FC<NewLogEntryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [sender, setSender] = useState('S3 Einsatz');
  const [recipient, setRecipient] = useState('Führungsstab');
  const [content, setContent] = useState('');
  const [action, setAction] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      sender: sender.trim(),
      recipient: recipient.trim(),
      content: content.trim(),
      action: action.trim()
    });

    setContent('');
    setAction('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-4 shadow-2xl text-slate-100 select-text">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-lg tracking-wide uppercase">Neuer Tagebucheintrag (ETB)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-base">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Absender (Von) *</label>
              <input
                type="text"
                required
                value={sender}
                onChange={e => setSender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Empfänger (An) *</label>
              <input
                type="text"
                required
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Meldung / Inhalt *</label>
            <textarea
              rows={3}
              required
              placeholder="Genaue Meldung oder Information..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Getroffene Maßnahme / Entschluss</label>
            <input
              type="text"
              placeholder="z.B. Zug alarmiert, Deichwache eingerichtet..."
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
            />
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
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-bold transition-colors"
            >
              Ins ETB eintragen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
