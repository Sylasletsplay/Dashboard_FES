import React, { useState } from 'react';
import { WidgetProps } from '../types/widget';
import { BookOpen, Search } from 'lucide-react';

interface LogbookWidgetProps extends WidgetProps {}

export const LogbookWidget: React.FC<LogbookWidgetProps> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEtb = [...state.etb]
    .reverse()
    .filter(entry => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        entry.content.toLowerCase().includes(q) ||
        entry.sender.toLowerCase().includes(q) ||
        (entry.action && entry.action.toLowerCase().includes(q))
      );
    });

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm tracking-wide uppercase text-slate-100">
            Einsatztagebuch (ETB / DV 100)
          </h3>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        <input
          type="text"
          placeholder="Tagebuch durchsuchen..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Log list container */}
      <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
        {filteredEtb.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Keine Tagebucheinträge gefunden.
          </div>
        ) : (
          filteredEtb.map(entry => (
            <div
              key={entry.id}
              className="bg-slate-950/70 p-2 rounded border border-slate-800/90 hover:border-slate-700 transition-colors text-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-mono font-bold text-purple-400">
                  #{entry.id}
                </span>
                <span className="font-mono">
                  {entry.timestamp.includes('T')
                    ? entry.timestamp.split('T')[1].substring(0, 8)
                    : entry.timestamp.split(' ')[1] || entry.timestamp}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mb-1">
                <strong className="text-slate-300">Von:</strong> {entry.sender} ➔ <strong className="text-slate-300">An:</strong> {entry.recipient}
              </div>
              <div className="text-slate-100 font-medium my-1">
                {entry.content}
              </div>
              {entry.action && (
                <div className="mt-1 pt-1 border-t border-slate-900 text-[11px] text-emerald-400/90 font-mono">
                  <span className="text-slate-500">Maßnahme:</span> {entry.action}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
