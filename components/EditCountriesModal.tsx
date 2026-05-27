import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface EditCountriesModalProps {
  student: Student;
  allCountries: string[];
  onSave: (countries: string[]) => void;
  onClose: () => void;
}

export const EditCountriesModal: React.FC<EditCountriesModalProps> = ({ student, allCountries, onSave, onClose }) => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => {
    setSelectedCountries(student.preferredCountries || []);
  }, [student]);

  const handleCheckboxChange = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedCountries);
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
        className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg m-4 transform transition-all border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <div>
                <h2 id="modal-title" className="text-xl font-bold text-white">Edit Preferred Countries</h2>
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

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="max-h-64 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allCountries.map(country => (
              <label key={country} className="flex items-center space-x-2 p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country)}
                  onChange={() => handleCheckboxChange(country)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-200">{country}</span>
              </label>
            ))}
          </div>
          <div className="pt-6 flex justify-end space-x-3">
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
              Save Countries
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
