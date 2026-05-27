import React, { useState, useRef } from 'react';
import { User } from '../types';
import { AttendanceModal } from './AttendanceModal';
import { LeaveModal } from './LeaveModal';
import { Calendar, Palmtree, LogOut, Key, User as UserIcon, MapPin, Phone, Mail, Home, Edit2, Check, X } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onUpdate, onLogout }) => {
  const [formData, setFormData] = useState<User>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 6
    if (/^\d{0,6}$/.test(value)) {
      setNewPassword(value);
    }
  };

  const savePassword = () => {
    if (newPassword.length === 6) {
      const updatedUser = { ...formData, password: newPassword };
      setFormData(updatedUser);
      onUpdate(updatedUser);
      alert('Password changed successfully!');
      setIsChangingPassword(false);
      setNewPassword('');
    } else {
      alert('Password must be exactly 6 digits.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b border-slate-700">
          <h2 className="text-xl font-bold">User Profile</h2>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white hover:bg-red-600 rounded-md transition-all"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto bg-slate-800">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <img 
                src={formData.avatarUrl} 
                alt={formData.fullName} 
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-md"
                referrerPolicy="no-referrer"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">{formData.fullName}</h3>
              <p className="text-sm text-slate-400">User ID: {formData.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-slate-200 font-medium">{formData.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email ID</label>
                <p className="text-slate-200 font-medium">{formData.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mobile Number</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-slate-200 font-medium">{formData.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Home Address</label>
                {isEditing ? (
                  <textarea 
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({...formData, homeAddress: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-20"
                  />
                ) : (
                  <p className="text-slate-200 font-medium">{formData.homeAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <p className="text-slate-200 font-medium">{formData.emergencyContact}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group"
              >
                <Calendar className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-blue-100">Attendance</span>
                <span className="text-[10px] text-blue-400/70">Clock-in/out</span>
              </button>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all group"
              >
                <Palmtree className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-amber-100">Leaves</span>
                <span className="text-[10px] text-amber-400/70">Apply & Balance</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-700 space-y-4">
              {isChangingPassword ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password (6 digits)</label>
                  <div className="flex space-x-2">
                    <input 
                      type="password" 
                      maxLength={6}
                      value={newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter 6 digits"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button 
                      onClick={savePassword}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-all"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword('');
                      }}
                      className="px-4 py-2 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-medium">Change Password</span>
                </button>
              )}

              <button 
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors w-full pt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-700 flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button 
                onClick={() => {
                  setFormData(user);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-all shadow-md"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-all shadow-md"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {showAttendanceModal && (
        <AttendanceModal user={user} onClose={() => setShowAttendanceModal(false)} />
      )}
      {showLeaveModal && (
        <LeaveModal user={user} onClose={() => setShowLeaveModal(false)} />
      )}
    </div>
  );
};
