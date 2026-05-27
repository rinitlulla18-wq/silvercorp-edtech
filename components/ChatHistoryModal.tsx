import React, { useState, useEffect, useRef } from 'react';
import { Student, ChatMessage } from '../types';

interface ChatHistoryModalProps {
  student: Student;
  onClose: () => void;
  onAddMessage: (message: string) => void;
  onToggleFlagMessage: (messageId: number) => void;
}

const FlagIcon: React.FC<{ isFilled?: boolean }> = ({ isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {isFilled ? (
             <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" fill="currentColor" />
        ) : (
             <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        )}
    </svg>
);


export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ student, onClose, onAddMessage, onToggleFlagMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [student.chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onAddMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg h-[90vh] max-h-[700px] m-4 flex flex-col transform transition-all border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-white">Conversation History</h2>
              <p className="text-sm text-slate-400">{student.fullName}</p>
            </div>
            <button 
                onClick={onClose} 
                className="p-1 text-slate-400 hover:text-white hover:bg-red-600 rounded-md transition-all" 
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        </header>

        <main ref={chatContainerRef} className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-900">
          <div className="space-y-4">
            {student.chatHistory.map((message) => {
              if (message.sender === 'system') {
                  return (
                      <div key={message.id} className="text-center my-2">
                          <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs italic border border-slate-700">
                              {message.text}
                          </span>
                      </div>
                  )
              }
              
              const isAgent = message.sender === 'agent';
              
              const flagButton = (
                  <button
                    onClick={() => onToggleFlagMessage(message.id)}
                    className={`p-1 rounded-full ${message.isFlagged ? 'text-blue-500' : 'text-slate-500'} hover:bg-slate-800 hover:text-slate-300 transition-colors`}
                    aria-label={message.isFlagged ? "Unflag message" : "Flag message for review"}
                    title={message.isFlagged ? "Unflag message" : "Flag message for review"}
                  >
                    <FlagIcon isFilled={!!message.isFlagged} />
                  </button>
              );

              return (
              <div key={message.id} className={`flex flex-col gap-1 ${isAgent ? 'items-end' : 'items-start'}`}>
                {message.userName && (
                    <span className={`text-xs text-slate-500 ${isAgent ? 'pr-10' : 'pl-10'}`}>
                        {message.userName}
                    </span>
                )}
                <div className={`flex items-end gap-2 ${isAgent ? 'justify-end' : 'justify-start'} w-full`}>
                  {!isAgent && flagButton}

                  {!isAgent && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mb-1">
                          {student.fullName.charAt(0)}
                      </div>
                  )}
                  <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                      isAgent
                        ? 'bg-slate-700 text-white rounded-br-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                    }`}>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                        isAgent ? 'text-slate-300' : 'text-slate-400'
                      } text-right`}>
                      {formatDate(message.timestamp)}
                    </p>
                  </div>
                   {isAgent && (
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mb-1" title={message.userName || 'Agent'}>
                          {message.userName ? message.userName.charAt(0).toUpperCase() : 'A'}
                      </div>
                  )}

                  {isAgent && flagButton}
                </div>
              </div>
            )})}
          </div>
        </main>

        <footer className="p-4 border-t border-slate-700">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a new note..."
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-700 disabled:text-slate-500"
              disabled={!newMessage.trim()}
              aria-label="Save Note"
            >
              Save
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};