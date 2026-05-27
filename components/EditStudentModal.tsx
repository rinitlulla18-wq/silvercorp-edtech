import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface EditStudentModalProps {
  student: Student;
  onSave: (student: Omit<Student, 'id' | 'avatarUrl' | 'preferredCountries'>) => void;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
  });

  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.fullName,
        email: student.email,
        mobile: student.mobile,
      });
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...student,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
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
        className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg m-4 transform transition-all border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <h2 id="modal-title" className="text-xl font-bold text-white">Edit Student Details</h2>
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
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 w-full pl-4 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full pl-4 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-slate-300">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              id="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="mt-1 w-full pl-4 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
