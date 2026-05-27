import React, { useState } from 'react';
import { Student, LeadStatus, ServiceCategory, User } from '../types';
import { countryMap } from '../data/countries';

const SortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
);

const SortAscendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
    </svg>
);

const SortDescendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7" />
    </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-slate-400 group-hover:text-slate-200"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);

const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25-2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-slate-400 group-hover:text-slate-200"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-white group-hover:text-slate-300"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 text-slate-400 group-hover:text-slate-200"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const RevealedInfo: React.FC<{ value: string; onCopy: () => void; copied: boolean }> = ({ value, onCopy, copied }) => (
    <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-md p-1.5 text-xs animate-fade-in w-max" onClick={(e) => e.stopPropagation()}>
        <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
        <span className="text-slate-200 font-mono">{value}</span>
        <button onClick={onCopy} className="text-slate-400 hover:text-white p-1 rounded-md" aria-label={`Copy ${value}`}>
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    </div>
);

const LeadStatusSelector: React.FC<{ student: Student; onUpdateLeadStatus: (studentId: number, newStatus: LeadStatus) => void }> = ({ student, onUpdateLeadStatus }) => {
    const statuses: LeadStatus[] = ['New', 'In Follow-up', 'Converted', 'Lost', 'Finalised'];
    const statusColorClasses = {
        'New': 'bg-blue-900/30 text-blue-400 border-blue-900/50 focus:ring-blue-500',
        'In Follow-up': 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50 focus:ring-yellow-500',
        'Converted': 'bg-green-900/30 text-green-400 border-green-900/50 focus:ring-green-500',
        'Lost': 'bg-red-900/30 text-red-400 border-red-900/50 focus:ring-red-500',
        'Finalised': 'bg-purple-900/30 text-purple-400 border-purple-900/50 focus:ring-purple-500',
    };
    
    const baseClasses = "px-2.5 py-0.5 text-sm font-semibold rounded-full border-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all";

    return (
        <select
            value={student.leadStatus}
            onChange={(e) => onUpdateLeadStatus(student.id, e.target.value as LeadStatus)}
            className={`${baseClasses} ${statusColorClasses[student.leadStatus]}`}
            aria-label={`Update lead status for ${student.fullName}`}
            onClick={(e) => e.stopPropagation()}
        >
            {statuses.map(status => (
                <option key={status} value={status} className="bg-slate-900 text-slate-200">{status}</option>
            ))}
        </select>
    );
}

const ServiceCategorySelector: React.FC<{ student: Student; onUpdateServiceCategory: (studentId: number, newCategory: ServiceCategory) => void }> = ({ student, onUpdateServiceCategory }) => {
    const categories: ServiceCategory[] = ['Document Editing', 'Abroad Education', 'Domestic Education', 'Visa Support', 'Test Prep', 'Profile Building', 'Education Loan', 'Other'];
    const categoryColorClasses: Record<ServiceCategory, string> = {
        'Document Editing': 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50 focus:ring-indigo-500',
        'Abroad Education': 'bg-cyan-900/30 text-cyan-400 border-cyan-900/50 focus:ring-cyan-500',
        'Domestic Education': 'bg-pink-900/30 text-pink-400 border-pink-900/50 focus:ring-pink-500',
        'Visa Support': 'bg-orange-900/30 text-orange-400 border-orange-900/50 focus:ring-orange-500',
        'Test Prep': 'bg-teal-900/30 text-teal-400 border-teal-900/50 focus:ring-teal-500',
        'Profile Building': 'bg-lime-900/30 text-lime-400 border-lime-900/50 focus:ring-lime-500',
        'Education Loan': 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50 focus:ring-emerald-500',
        'Other': 'bg-slate-700 text-slate-300 border-slate-600 focus:ring-slate-500',
    };

    const baseClasses = "px-2.5 py-0.5 text-sm font-semibold rounded-full border-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all";

    return (
        <select
            value={student.serviceCategory}
            onChange={(e) => onUpdateServiceCategory(student.id, e.target.value as ServiceCategory)}
            className={`${baseClasses} ${categoryColorClasses[student.serviceCategory]}`}
            aria-label={`Update service category for ${student.fullName}`}
            onClick={(e) => e.stopPropagation()}
        >
            {categories.map(category => (
                <option key={category} value={category} className="bg-slate-900 text-slate-200">{category}</option>
            ))}
        </select>
    );
};

interface StudentTableProps {
  students: Student[];
  onEditCountries: (student: Student) => void;
  onEditFollowUp: (student: Student) => void;
  onUpdateLeadStatus: (studentId: number, newStatus: LeadStatus) => void;
  onUpdateServiceCategory: (studentId: number, newCategory: ServiceCategory) => void;
  onUpdateAssignedUser?: (studentId: number, newUserId: string) => void;
  onViewChat: (student: Student) => void;
  sortConfig: { key: 'followUpDate'; direction: 'ascending' | 'descending' } | null;
  onSort: (key: 'followUpDate') => void;
  onStudentClick: (student: Student) => void;
  followUpFilter: string;
  currentUser?: User | null;
  employees?: User[];
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onEditCountries, onEditFollowUp, onUpdateLeadStatus, onUpdateServiceCategory, onUpdateAssignedUser, onViewChat, sortConfig, onSort, onStudentClick, followUpFilter, currentUser, employees }) => {
    const getFollowUpFilterLabel = (filter: string) => {
        switch(filter) {
            case 'overdue': return 'Overdue';
            case 'today': return 'Today';
            case 'in_a_week': return 'In a week';
            case 'not_required': return 'Not Required';
            default: return '';
        }
    };

    const filterLabel = getFollowUpFilterLabel(followUpFilter);
  const [revealedContact, setRevealedContact] = useState<{ studentId: number; type: 'email' | 'mobile' } | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [revealedHistory, setRevealedHistory] = useState<number | null>(null);

  const handleToggleContact = (studentId: number, type: 'email' | 'mobile') => {
    if (revealedContact?.studentId === studentId && revealedContact?.type === type) {
      setRevealedContact(null);
    } else {
      setRevealedContact({ studentId, type });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => {
        setCopiedValue(null);
    }, 2000);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  
  const renderCountryBadges = (student: Student) => (
      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {student.preferredCountries.map(country => (
              <span 
                key={country} 
                title={country} 
                className="inline-block px-2 py-0.5 bg-slate-700 text-slate-200 text-sm font-semibold rounded-full"
              >
                  {countryMap[country] || country}
              </span>
          ))}
          <button onClick={() => onEditCountries(student)} className="p-1 rounded-full hover:bg-slate-700 group" aria-label={`Edit ${student.fullName}'s preferred countries`}>
            <PencilIcon/>
          </button>
      </div>
  );

  const renderFollowUpDate = (student: Student) => {
    if (student.leadStatus === 'Lost') {
      return <span className="text-slate-500">Not Required</span>;
    }

    const EditButton = () => (
      <button onClick={(e) => { e.stopPropagation(); onEditFollowUp(student); }} className="p-1 rounded-full hover:bg-slate-700 group" aria-label={`Set or edit ${student.fullName}'s follow-up date`}>
          <CalendarIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
      </button>
    );

    if (!student.followUpDate) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Not Required</span>
          <EditButton />
        </div>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const followUpDate = new Date(student.followUpDate);
    const timeDiff = followUpDate.getTime() - today.getTime();
    
    let dateColorClass = 'text-slate-400';
    if (timeDiff < 0) {
        dateColorClass = 'text-red-400 font-semibold'; // Overdue
    } else if (timeDiff >= 0) {
        dateColorClass = 'text-blue-400'; // Upcoming or today
    }

    const formattedDate = new Date(student.followUpDate + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
      <div className="flex items-center gap-2">
        <span 
            className={`${dateColorClass} cursor-pointer hover:underline`}
            onClick={(e) => { e.stopPropagation(); onEditFollowUp(student); }}
        >
            {formattedDate}
        </span>
        <EditButton />
      </div>
    );
  };

  const renderRecentNotes = (student: Student) => (
    <div className="flex items-start justify-end gap-2 max-w-[390px] ml-auto text-right" onClick={(e) => e.stopPropagation()}>
        <p 
            className="text-base text-slate-300 flex-grow whitespace-normal cursor-pointer hover:underline"
            onClick={() => onViewChat(student)}
        >
            {student.notes}
        </p>
        <button onClick={() => onViewChat(student)} className="p-1 rounded-full hover:bg-slate-700 group flex-shrink-0" aria-label={`View chat history for ${student.fullName}`}>
            <ChatIcon />
        </button>
    </div>
  );

  const renderAssignedUser = (student: Student) => {
    if (currentUser?.role !== 'admin') return null;
    
    const baseClasses =
      "w-full min-w-0 max-w-full px-2 py-1 text-base font-medium text-center rounded-lg border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500";

    return (
      <div className="flex min-w-0 w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <select
            value={student.assignedUserId || ''}
            onChange={(e) => onUpdateAssignedUser && onUpdateAssignedUser(student.id, e.target.value)}
            className={baseClasses}
            aria-label={`Assign user for ${student.fullName}`}
        >
            <option value="">Unassigned</option>
            {employees?.map(emp => (
                <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                </option>
            ))}
        </select>
      </div>
    );
  };
  
  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900 rounded-lg shadow-sm border border-slate-700">
        <h3 className="text-lg font-medium text-slate-200">No students found.</h3>
        <p className="text-slate-400 mt-1">Try adjusting your search or filter.</p>
      </div>
    );
  }
  
  const renderStudentInfo = (student: Student) => (
    <div>
      <div className="text-base font-medium text-white">{student.fullName}</div>
      <div className="flex items-center gap-2">
        <span className="text-base text-slate-400 font-mono">{student.studentId}</span>
        {currentUser?.role === 'admin' && (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setRevealedHistory(prev => (prev === student.id ? null : student.id)); }}
              className="group flex items-center"
              aria-label={`Show history for ${student.fullName}`}
            >
              <HistoryIcon />
            </button>
            {revealedHistory === student.id && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 z-50 text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <p><strong className="font-semibold text-slate-200">Created:</strong> <span className="text-slate-400">{formatDate(student.createdDate)}</span></p>
                <p className="mt-1"><strong className="font-semibold text-slate-200">Updated:</strong> <span className="text-slate-400">{formatDate(student.lastModifiedDate)}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderContactControls = (student: Student) => (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-2">
            <div className="relative">
                <button 
                  onClick={() => handleToggleContact(student.id, 'mobile')} 
                  className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors duration-150"
                  aria-label={`Show ${student.fullName}'s mobile number`}
                > 
                  <PhoneIcon /> 
                </button>
                {revealedContact?.studentId === student.id && revealedContact.type === 'mobile' && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                        <RevealedInfo 
                            value={student.mobile}
                            onCopy={() => handleCopy(student.mobile)}
                            copied={copiedValue === student.mobile}
                        />
                    </div>
                )}
            </div>
            <div className="relative">
                <button 
                  onClick={() => handleToggleContact(student.id, 'email')} 
                  className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors duration-150"
                  aria-label={`Show ${student.fullName}'s email`}
                > 
                  <EmailIcon /> 
                </button>
                {revealedContact?.studentId === student.id && revealedContact.type === 'email' && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50">
                        <RevealedInfo 
                            value={student.email}
                            onCopy={() => handleCopy(student.email)}
                            copied={copiedValue === student.email}
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th scope="col" className={`px-4 py-2 text-center text-sm font-semibold text-slate-300 uppercase tracking-wider ${className || ''}`}>
        {children}
    </th>
  );

  return (
    <div className="bg-slate-800 border-y border-slate-700">
        {/* Mobile View */}
        <div className="md:hidden p-2 sm:p-4">
            {students.map((student) => (
                <div key={student.id} className="bg-slate-900 rounded-lg shadow-md border border-slate-700 p-4 mb-4" onClick={() => onStudentClick(student)}>
                    <div className="flex justify-between items-start">
                        {renderStudentInfo(student)}
                        <LeadStatusSelector student={student} onUpdateLeadStatus={onUpdateLeadStatus} />
                    </div>
                    {renderContactControls(student)}
                    <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="text-base text-slate-300 font-medium mb-2">Follow-up Date:</p>
                        {renderFollowUpDate(student)}
                    </div>
                    <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="text-base text-slate-300 font-medium mb-2">Service Category:</p>
                        <ServiceCategorySelector student={student} onUpdateServiceCategory={onUpdateServiceCategory} />
                    </div>
                    <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="text-base text-slate-300 font-medium mb-2">Preferred Countries:</p>
                        {renderCountryBadges(student)}
                    </div>
                    {currentUser?.role === 'admin' && (
                        <div className="mt-4 border-t border-slate-800 pt-3">
                            <p className="text-base text-slate-300 font-medium mb-2">Assigned User:</p>
                            {renderAssignedUser(student)}
                        </div>
                    )}
                     <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="text-base text-slate-300 font-medium mb-2">Recent Notes:</p>
                        {renderRecentNotes(student)}
                    </div>
                </div>
            ))}
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block">
            <table className="min-w-full divide-y divide-slate-700 table-fixed">
                <thead className="bg-slate-900 sticky md:top-[248px] lg:top-[136px] z-20">
                <tr>
                    <TableHeader className="w-[250px] sticky left-0 z-30 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Student Info</TableHeader>
                    <th scope="col" className="px-4 py-2 text-center text-sm font-semibold text-slate-300 uppercase tracking-wider w-[160px]">
                        <div className="flex justify-center">
                            <button type="button" onClick={() => onSort('followUpDate')} className="inline-flex items-center justify-center gap-1.5 group focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-md px-2 py-1">
                                <span>Follow-up Date</span>
                                {sortConfig?.key === 'followUpDate' ? (
                                    sortConfig.direction === 'ascending' ? <SortAscendingIcon /> : <SortDescendingIcon />
                                ) : (
                                    <SortIcon />
                                )}
                            </button>
                        </div>
                    </th>
                    <TableHeader className="w-[120px]">Lead Status</TableHeader>
                    <TableHeader className="w-[160px]">Service Category</TableHeader>
                    <TableHeader className="w-[160px]">Preferred Countries</TableHeader>
                    {currentUser?.role === 'admin' && (
                        <TableHeader className="w-[196px] !px-2">Assigned User</TableHeader>
                    )}
                    <TableHeader className="w-[390px]">Recent Notes</TableHeader>
                </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-700 transition-colors duration-150 cursor-pointer group" onClick={() => onStudentClick(student)}>
                    <td className="px-4 py-2 w-[250px] sticky left-0 z-10 bg-slate-800 group-hover:bg-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.3)] transition-colors duration-150">
                        {renderStudentInfo(student)}
                        {renderContactControls(student)}
                    </td>
                    <td className="px-4 py-2 text-base w-[160px]">
                        {renderFollowUpDate(student)}
                    </td>
                    <td className="px-4 py-2 text-base text-slate-400 w-[120px]">
                        <LeadStatusSelector student={student} onUpdateLeadStatus={onUpdateLeadStatus} />
                    </td>
                    <td className="px-4 py-2 text-base text-slate-400 w-[160px]">
                        <ServiceCategorySelector student={student} onUpdateServiceCategory={onUpdateServiceCategory} />
                    </td>
                    <td className="px-4 py-2 text-base text-slate-300 w-[160px]">
                        {renderCountryBadges(student)}
                    </td>
                    {currentUser?.role === 'admin' && (
                        <td className="px-2 py-2 text-base text-slate-300 w-[196px] align-middle text-center">
                            {renderAssignedUser(student)}
                        </td>
                    )}
                    <td className="px-4 py-2 text-center w-[390px]">
                        {renderRecentNotes(student)}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};