import React, { useRef, useState } from 'react';
import { SilverCorpLogo } from './SilverCorpLogo';
import { Student, User } from '../types';
import { UserProfileModal } from './UserProfileModal';
import { LogoManagerModal } from './LogoManagerModal';

const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ImportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

interface HeaderProps {
    onAddLeadClick: () => void;
    onImportClick: () => void;
    onExportClick: () => void;
    onLogout: () => void;
    onRefresh: () => void;
    activeTab: 'dashboard' | 'leads' | 'tasks' | 'detail' | 'admin';
    onTabChange: (tab: 'dashboard' | 'leads' | 'tasks' | 'detail' | 'admin') => void;
    onCloseStudentTab: (studentId: number) => void;
    openStudents: Student[];
    selectedStudentId?: number;
    onSwitchToStudent: (student: Student) => void;
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    logoUrl: string;
    onUpdateLogo: (url: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddLeadClick, onImportClick, onExportClick, onLogout, onRefresh, activeTab, onTabChange, onCloseStudentTab, openStudents, selectedStudentId, onSwitchToStudent, user, onUpdateUser, logoUrl, onUpdateLogo }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoManagerOpen, setIsLogoManagerOpen] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="bg-slate-800 shadow-md sticky top-0 z-50">
      <div className="w-full px-2">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center space-x-6 flex-shrink-0">
             <div className="flex items-center space-x-3">
                <div className="relative group/logo">
                    <div className="flex items-center justify-center h-10 w-10 bg-slate-900 rounded-lg overflow-hidden p-1 border border-slate-700">
                        <SilverCorpLogo className="h-full w-full" src={logoUrl} />
                    </div>
                    {user.role === 'admin' && (
                        <button 
                            onClick={() => setIsLogoManagerOpen(true)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity rounded-lg"
                            title="Edit Logo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    )}
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight hidden md:block">
                SilverCorp Edtech
                </h1>
            </div>
            
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onTabChange('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'dashboard' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => onTabChange('leads')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'leads' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    All Leads
                </button>
                <button
                    onClick={() => onTabChange('tasks')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'tasks' 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    Tasks
                </button>
                {user.role === 'admin' && (
                    <button
                        onClick={() => onTabChange('admin')}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === 'admin' 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        Admin Tool
                    </button>
                )}
            </div>
          </div>

          <div className="flex-1 flex items-center min-w-0 relative group">
            {openStudents.length > 0 && (
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 z-10 p-1 bg-slate-800/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}
            
            <div 
                ref={scrollContainerRef}
                className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth px-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {openStudents.map(student => (
                    <div key={student.id} className="flex items-center flex-shrink-0">
                        <button
                            onClick={() => onSwitchToStudent(student)}
                            className={`px-3 py-2 rounded-l-md text-sm font-medium transition-colors flex items-center gap-2 border-r border-slate-700/50 ${
                                activeTab === 'detail' && selectedStudentId === student.id
                                ? 'bg-slate-900 text-white' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span className="max-w-[100px] truncate">{student.fullName}</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseStudentTab(student.id);
                            }}
                            className={`px-2 py-2 rounded-r-md text-sm font-medium transition-colors ${
                                activeTab === 'detail' && selectedStudentId === student.id
                                ? 'bg-slate-900 text-white hover:bg-red-600' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:bg-red-600'
                            }`}
                            title="Close tab"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {openStudents.length > 0 && (
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-0 z-10 p-1 bg-slate-800/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            {activeTab === 'leads' && (
                <div className="flex items-center space-x-1">
                    {user.role === 'admin' ? (
                        <>
                            <button
                                type="button"
                                onClick={onImportClick}
                                className="p-2 rounded-full text-white hover:bg-slate-700 transition-colors"
                                title="Import CSV/Excel"
                            >
                                <ImportIcon />
                            </button>
                            <button
                                type="button"
                                onClick={onExportClick}
                                className="p-2 rounded-full text-white hover:bg-slate-700 transition-colors"
                                title="Export CSV"
                            >
                                <ExportIcon />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onAddLeadClick}
                            className="p-2 rounded-full text-white hover:bg-slate-700 transition-colors"
                            title="Add Lead"
                        >
                            <PlusIcon />
                        </button>
                    )}
                </div>
            )}
            
            <div className="h-8 w-[1px] bg-slate-700 mx-1"></div>

            <button
                onClick={onRefresh}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Refresh CRM"
            >
                <RefreshIcon />
            </button>

            <button
                onClick={() => setIsProfileModalOpen(true)}
                className="relative group p-0.5 rounded-full border-2 border-transparent hover:border-slate-400 transition-all"
                aria-label="User Profile"
            >
                <img 
                    src={user.avatarUrl} 
                    alt={user.fullName} 
                    className="h-9 w-9 rounded-full object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
            </button>

          </div>
        </div>
      </div>

      {isProfileModalOpen && (
        <UserProfileModal 
            user={user} 
            onClose={() => setIsProfileModalOpen(false)} 
            onUpdate={onUpdateUser}
            onLogout={onLogout}
        />
      )}

      {isLogoManagerOpen && (
        <LogoManagerModal
            currentLogoUrl={logoUrl}
            onSave={onUpdateLogo}
            onClose={() => setIsLogoManagerOpen(false)}
        />
      )}
    </header>
  );
};
