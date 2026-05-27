import React, { useState } from 'react';
import type { Note } from '../types';
import { NotesIcon } from './icons';

interface NotesTabProps {
  notes: Note[];
  onAddNote: (noteText: string) => void;
}

const formatDate = (date: Date): string => {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const NotesTab: React.FC<NotesTabProps> = ({ notes, onAddNote }) => {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    onAddNote(newNote);
    setNewNote('');
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-md flex flex-col border border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">Notes History</h2>
      </div>

      <div className="p-6 space-y-6 flex-grow max-h-[500px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-slate-500 text-center italic">No detailed notes yet.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${note.avatarBgColor} flex items-center justify-center`}>
                {note.author === 'System' ? (
                  <NotesIcon className="w-5 h-5 text-slate-500" />
                ) : (
                  <span className={`font-bold ${note.avatarTextColor}`}>{note.authorInitials}</span>
                )}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <p className="font-semibold text-slate-200">{note.author}</p>
                  <p className="text-xs text-slate-500">{note.timestamp}</p>
                </div>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed whitespace-pre-wrap">{note.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-700">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center border border-green-800/50">
            <span className="font-bold text-green-400">ME</span>
          </div>
          <div className="flex-grow">
            <label htmlFor="new-note-textarea" className="sr-only">Add a new note</label>
            <textarea
              id="new-note-textarea"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-200 resize-none placeholder-slate-500"
              rows={3}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddNote();
                  }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                Adding note as <span className="font-semibold text-slate-400">Me</span> on {formatDate(new Date())}
              </p>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                disabled={!newNote.trim()}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};