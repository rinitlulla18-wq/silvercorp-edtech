import React, { useState } from 'react';

interface ExportModalProps {
  onClose: () => void;
  onExport: (
    startDate: string,
    endDate: string,
    options: {
      leadStatus: boolean;
      preferredCountries: boolean;
      followUpDate: boolean;
      notes: boolean;
      serviceCategory: boolean;
      assignedUser: boolean;
    }
  ) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today);

  const [includeLeadStatus, setIncludeLeadStatus] = useState(true);
  const [includeCountries, setIncludeCountries] = useState(true);
  const [includeFollowUp, setIncludeFollowUp] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeServiceCategory, setIncludeServiceCategory] = useState(true);
  const [includeAssignedUser, setIncludeAssignedUser] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
        alert('Please select a start and end date.');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after the end date.');
        return;
    }
    onExport(startDate, endDate, {
        leadStatus: includeLeadStatus,
        preferredCountries: includeCountries,
        followUpDate: includeFollowUp,
        notes: includeNotes,
        serviceCategory: includeServiceCategory,
        assignedUser: includeAssignedUser,
    });
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
        className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4 transform transition-all border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h2 id="modal-title" className="text-xl font-bold text-white">Export Student Data</h2>
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
        <p className="text-sm text-slate-400 mt-2">
            Select a date range for student creation date. The export will also respect any active filters on the main page.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-500 cursor-pointer [color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-500 cursor-pointer [color-scheme:dark]"
                required
              />
            </div>
          </div>
          
          <div className="pt-2">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Optional Fields to Include:</h3>
              <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={includeLeadStatus}
                          onChange={(e) => setIncludeLeadStatus(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Lead Status</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={includeServiceCategory}
                          onChange={(e) => setIncludeServiceCategory(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Service Category</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={includeCountries}
                          onChange={(e) => setIncludeCountries(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Preferred Countries</span>
                  </label>
                   <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={includeFollowUp}
                          onChange={(e) => setIncludeFollowUp(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Follow-up Date</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={includeNotes}
                          onChange={(e) => setIncludeNotes(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Recent Notes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={includeAssignedUser}
                          onChange={(e) => setIncludeAssignedUser(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Assigned User</span>
                  </label>
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};