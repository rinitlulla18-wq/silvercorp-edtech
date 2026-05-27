import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface EditFollowUpModalProps {
  student: Student;
  onSave: (date: string, comment: string) => void;
  onClose: () => void;
}

export const EditFollowUpModal: React.FC<EditFollowUpModalProps> = ({ student, onSave, onClose }) => {
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Set initial date, defaulting to today if none exists
    const initialDate = student.followUpDate || new Date().toISOString().split('T')[0];
    setDate(initialDate);
    setComment('');
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(date, comment);
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-sm m-4 transform transition-all border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <div>
                <h2 id="modal-title" className="text-xl font-bold text-white">Set Follow-up Date</h2>
                <p className="text-sm text-slate-400 mt-1">For {student.fullName}</p>
            </div>
            <button 
                onClick={onClose} 
                className="p-1 text-slate-400 hover:text-white hover:bg-red-600 rounded-md transition-all" 
                aria-label="Close modal"
            >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
                <label htmlFor="followUpDate" className="block text-sm font-medium text-slate-300 mb-1">
                    Select Date
                </label>
                <input
                    type="date"
                    id="followUpDate"
                    name="followUpDate"
                    value={date}
                    min={new Date().toLocaleDateString('sv-SE')}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-500 cursor-pointer [color-scheme:dark]"
                    required
                />
            </div>
            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-slate-300 mb-1">
                    Add Comment
                </label>
                <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-600"
                    placeholder="Enter followup details..."
                />
                <div className="mt-3">
                    <p className="text-xs font-medium text-slate-400 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                        {['Call not received', 'Call not Connected', 'Call Declined', 'Call Picked but Busy', 'Not Interested'].map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => setComment(suggestion)}
                                className="text-[12px] px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 hover:text-white transition-colors border border-slate-600"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Date
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
