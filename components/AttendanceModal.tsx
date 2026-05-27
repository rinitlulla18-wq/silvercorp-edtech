import React from 'react';
import { User } from '../types';
import { AttendanceLeavesSection } from './AttendanceLeavesSection';
import { X, Calendar } from 'lucide-react';

interface AttendanceModalProps {
  user: User;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ 
  user, 
  onClose, 
  title = "Attendance", 
  subtitle = "Track your daily clock-in/out" 
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[78vh] overflow-y-auto bg-slate-800 custom-scrollbar">
          <AttendanceLeavesSection userId={user.id} mode="attendance" />
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
