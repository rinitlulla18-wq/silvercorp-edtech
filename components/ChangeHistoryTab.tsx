import React from 'react';
import { NotesIcon, CalendarIcon, ArrowRightIcon, GlobeIcon, EditIcon } from './icons';
import { HistoryEntry } from '../types';

interface ChangeHistoryTabProps {
  history: HistoryEntry[];
}

const eventIcons: Record<string, React.ReactNode> = {
    status: <ArrowRightIcon className="w-5 h-5 text-slate-400"/>,
    countries: <GlobeIcon className="w-5 h-5 text-slate-400"/>,
    note: <NotesIcon className="w-5 h-5 text-slate-400"/>,
    date: <CalendarIcon className="w-5 h-5 text-slate-400"/>,
    service: <EditIcon className="w-5 h-5 text-slate-400"/>,
    general: <EditIcon className="w-5 h-5 text-slate-400"/>
};

export const ChangeHistoryTab: React.FC<ChangeHistoryTabProps> = ({ history }) => {
  const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
      <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-4 mb-6">Student Profile Change History</h2>
      {sortedHistory.length === 0 ? (
        <p className="text-slate-400 text-center py-8 italic">No change history recorded yet.</p>
      ) : (
        <div className="space-y-8">
          {sortedHistory.map((event) => (
            <div key={event.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                {eventIcons[event.type] || <EditIcon className="w-5 h-5 text-slate-400"/>}
              </div>
              <div>
                {event.description.includes('|') ? (
                  <div className="space-y-1">
                    {event.description.split('|').map((part, index) => {
                      const trimmedPart = part.trim();
                      if (!trimmedPart) return null;
                      
                      if (index === 0) return <p key={index} className="font-bold text-slate-100 text-sm">{trimmedPart}</p>;
                      if (index === 1) return <p key={index} className="text-slate-400 text-xs">{trimmedPart}</p>;
                      return <p key={index} className="text-slate-300 text-sm">{trimmedPart}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm leading-relaxed">{event.description}</p>
                )}
                <div className="flex items-baseline space-x-2 mt-1">
                  <p className="font-semibold text-slate-200 text-sm">{event.user}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
