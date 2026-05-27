import React, { useState, useRef, useEffect } from 'react';
import type { Student, Credential, EmergencyContact, Note, AppDocument, Task, UserTask, User } from '../types';
import { LeadStatus, ServiceCategory, TaskStatus } from '../types';
import { InfoIcon, PhoneIcon, EmailIcon, CalendarIcon, EditIcon, SaveIcon, CopyIcon, CheckIcon, ArrowLeftIcon, HistoryIcon } from './icons';
import { X, Briefcase, Building2, Users } from 'lucide-react';
import { Badge, BadgeColor } from './Badge';
import { DocumentsTab } from './DocumentsTab';
import { NotesTab } from './NotesTab';
import { ChangeHistoryTab } from './ChangeHistoryTab';
import { CredentialsTab } from './CredentialsTab';
import { TasksTab } from './TasksTab';
import { JourneyFlowchart } from './JourneyFlowchart';
import StudentExtendedForm from '../src/components/StudentExtendedForm';


interface StudentPageProps {
  student: Student;
  onBack: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onEditFollowUp: (student: Student) => void;
  onEditCountries: (student: Student) => void;
  onUpdateLeadStatus: (studentId: number, newStatus: LeadStatus) => void;
  onUpdateServiceCategory: (studentId: number, newCategory: ServiceCategory) => void;
  setUserTasks: React.Dispatch<React.SetStateAction<UserTask[]>>;
  employees: User[];
  currentUser?: User | null;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatNoteTimestamp = (date: Date): string => {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};


const leadStatusColors: Record<LeadStatus, BadgeColor> = {
    'New': 'blue',
    'In Follow-up': 'yellow',
    'Converted': 'green',
    'Lost': 'red',
    'Finalised': 'purple'
};

const serviceCategoryColors: Record<ServiceCategory, BadgeColor> = {
    'Document Editing': 'indigo',
    'Abroad Education': 'cyan',
    'Domestic Education': 'pink',
    'Visa Support': 'orange',
    'Test Prep': 'teal',
    'Profile Building': 'lime',
    'Education Loan': 'emerald',
    'Other': 'gray'
};

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <h3 className="text-sm font-medium text-slate-500 mb-2">{label}</h3>
    {children}
  </div>
);

type Tab = 'Details' | 'Journey' | 'Documents' | 'Tasks' | 'Notes' | 'Important Credentials' | 'Change History';

export const StudentPage: React.FC<StudentPageProps> = ({ 
    student, 
    onBack, 
    onUpdateStudent,
    onEditFollowUp,
    onEditCountries,
    onUpdateLeadStatus,
    onUpdateServiceCategory,
    setUserTasks,
    employees,
    currentUser
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  const [editableStudent, setEditableStudent] = useState<Student>(student);
  const [credentials, setCredentials] = useState<Credential[]>(Array.isArray(student.credentials) ? student.credentials : []);
  const [notes, setNotes] = useState<Note[]>(Array.isArray(student.detailedNotes) ? student.detailedNotes : []);
  const [documents, setDocuments] = useState<AppDocument[]>(Array.isArray(student.documents) ? student.documents : []);
  const [tasks, setTasks] = useState<Task[]>(Array.isArray(student.tasks) ? student.tasks : []);

  const [isContactEditing, setIsContactEditing] = useState(false);
  const [revealedHistory, setRevealedHistory] = useState(false);
  
  const [popoverOpen, setPopoverOpen] = useState<'phone' | 'email' | null>(null);
  const [copied, setCopied] = useState<'phone' | 'email' | null>(null);
  const [isCollabDropdownOpen, setIsCollabDropdownOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const phoneTriggerRef = useRef<HTMLButtonElement>(null);
  const emailTriggerRef = useRef<HTMLButtonElement>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const normalizedStudent = { ...student };
    if (normalizedStudent.collaborators) {
      normalizedStudent.collaborators = normalizedStudent.collaborators.map(c => 
        typeof c === 'string' ? { userId: c, status: 'Not Started Yet' } : c
      );
    }
    setEditableStudent(normalizedStudent);
    setCredentials(Array.isArray(student.credentials) ? student.credentials : []);
    setNotes(Array.isArray(student.detailedNotes) ? student.detailedNotes : []);
    setDocuments(Array.isArray(student.documents) ? student.documents : []);
    setTasks(Array.isArray(student.tasks) ? student.tasks : []);
  }, [student]);

  const handlePopoverToggle = (type: 'phone' | 'email') => {
    setPopoverOpen(prev => (prev === type ? null : type));
  };

  const handleCopy = (text: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => {
        setCopied(null);
        setPopoverOpen(null);
    }, 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        phoneTriggerRef.current && !phoneTriggerRef.current.contains(target) &&
        emailTriggerRef.current && !emailTriggerRef.current.contains(target)
      ) {
        setPopoverOpen(null);
      }
      if (collabDropdownRef.current && !collabDropdownRef.current.contains(target)) {
        setIsCollabDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStudentChange = (field: keyof Student, value: string) => {
    setEditableStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyContactChange = (field: keyof EmergencyContact, value: string) => {
      setEditableStudent(prev => ({
          ...prev,
          emergencyContact: {
              ...prev.emergencyContact,
              [field]: value,
          },
      }));
  };

  const handleUpdateCredential = (id: string, field: keyof Credential, value: string) => {
    const updatedCredentials = credentials.map(cred => (cred.id === id ? { ...cred, [field]: value } : cred));
    setCredentials(updatedCredentials);
    onUpdateStudent({ ...editableStudent, credentials: updatedCredentials });
  };

  const handleAddCredential = () => {
    const newCredential: Credential = {
        id: `cred${Date.now()}`,
        link: '',
        userId: '',
        pass: '',
        remark: '',
        additionalRemark: '',
    };
    const updatedCredentials = [...credentials, newCredential];
    setCredentials(updatedCredentials);
    onUpdateStudent({ ...editableStudent, credentials: updatedCredentials });
  };

  const handleDeleteCredential = (id: string) => {
    const updatedCredentials = credentials.filter(cred => cred.id !== id);
    setCredentials(updatedCredentials);
    onUpdateStudent({ ...editableStudent, credentials: updatedCredentials });
  };
  
  const handleAddNote = (noteText: string = '') => {
    if (!noteText || noteText.trim() === '') return;

    const newNoteObject: Note = {
      id: Date.now(),
      author: 'Me',
      authorInitials: 'ME',
      avatarBgColor: 'bg-green-200',
      avatarTextColor: 'text-green-700',
      timestamp: formatNoteTimestamp(new Date()),
      text: noteText.trim(),
    };

    const updatedNotes = [newNoteObject, ...notes];
    setNotes(updatedNotes);
    onUpdateStudent({ ...editableStudent, detailedNotes: updatedNotes });
  };

  const handleAddDocuments = (selectedFiles: File[]) => {
    const MAX_FILE_SIZE_MB = 3;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    const newDocuments: AppDocument[] = selectedFiles.map((file, index) => {
        const doc: AppDocument = {
            id: `${file.name}-${file.lastModified}-${index}`,
            file,
            status: 'pending',
            progress: 0,
        };
        if (file.size > MAX_FILE_SIZE_BYTES) {
            doc.status = 'error';
            doc.error = `File size exceeds ${MAX_FILE_SIZE_MB} MB`;
        }
        return doc;
    });

    const updatedDocuments = [...documents, ...newDocuments];
    setDocuments(updatedDocuments);
    onUpdateStudent({ ...editableStudent, documents: updatedDocuments });
  };

  const handleRemoveDocument = (documentId: string) => {
      const updatedDocuments = documents.filter(d => d.id !== documentId);
      setDocuments(updatedDocuments);
      onUpdateStudent({ ...editableStudent, documents: updatedDocuments });
  };

  const handleUploadDocument = (docId: string) => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'uploading', progress: 0 } : d));

      const interval = setInterval(() => {
          setDocuments(prev => {
              const currentDoc = prev.find(d => d.id === docId);
              if (!currentDoc || currentDoc.status !== 'uploading') {
                  clearInterval(interval);
                  return prev;
              }

              const newProgress = currentDoc.progress + 10;
              if (newProgress >= 100) {
                  clearInterval(interval);
                  const updatedDocs = prev.map(d => d.id === docId ? {
                      ...d,
                      progress: 100,
                      status: 'success',
                      uploadedBy: 'Me',
                      uploadedAt: new Date(),
                  } : d);
                  onUpdateStudent({ ...editableStudent, documents: updatedDocs });
                  return updatedDocs;
              }
              return prev.map(d => d.id === docId ? { ...d, progress: newProgress } : d);
          });
      }, 200);
  };
  
  const handleSaveTask = (newTaskData: Partial<Task>) => {
    const taskId = `task${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      description: newTaskData.description || '',
      dueDate: newTaskData.dueDate || new Date(),
      status: TaskStatus.ToDo,
      assignedTo: newTaskData.assignedTo || currentUser?.id || 'Me',
      assignedBy: newTaskData.assignedBy || currentUser?.id || 'Me',
      priority: newTaskData.priority || 'Medium',
    };
    
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    
    const updatedStudent = { ...editableStudent, tasks: updatedTasks };
    setEditableStudent(updatedStudent);
    onUpdateStudent(updatedStudent);

    // Sync with global userTasks
    const newUserTask: UserTask = {
        id: newTask.id,
        text: `[${student.fullName}] ${newTask.description}`,
        completed: false,
        date: newTask.dueDate.toISOString().split('T')[0],
        priority: newTask.priority
    };
    
    setUserTasks(prev => [newUserTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedTasks);
    
    const updatedStudent = { ...editableStudent, tasks: updatedTasks };
    setEditableStudent(updatedStudent);
    onUpdateStudent(updatedStudent);

    // Update global user tasks as well
    setUserTasks(prev => prev.map(ut => 
      ut.id === updatedTask.id 
        ? { 
            ...ut, 
            text: `[${student.fullName}] ${updatedTask.description}`,
            date: updatedTask.dueDate.toISOString().split('T')[0],
            priority: updatedTask.priority
          } 
        : ut
    ));
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    
    const updatedStudent = { ...editableStudent, tasks: updatedTasks };
    setEditableStudent(updatedStudent);
    onUpdateStudent(updatedStudent);
    
    // Sync with global userTasks
    setUserTasks(prev => prev.filter(ut => ut.id !== id));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'Details', label: 'Student Details' },
    { id: 'Notes', label: 'Notes' },
    { id: 'Tasks', label: 'Tasks' },
    { id: 'Journey', label: 'Journey' },
    { id: 'Documents', label: 'Documents' },
    { id: 'Important Credentials', label: 'Important Credentials' },
    ...(currentUser?.role === 'admin' ? [{ id: 'Change History' as Tab, label: 'Change History' }] : []),
  ];

  return (
    <div className="px-4 sm:px-6 py-4 space-y-6 bg-slate-900 min-h-screen text-slate-200">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
            <h1 className="text-3xl font-bold text-white">{editableStudent.fullName}</h1>
            <div className="flex items-center space-x-2 mt-1 text-slate-400">
                <span className="text-base font-medium">{editableStudent.studentId}</span>
                {currentUser?.role === 'admin' && (
                  <div className="relative">
                    <button 
                      onClick={() => setRevealedHistory(!revealedHistory)}
                      className="text-slate-500 hover:text-slate-300 transition-colors flex items-center"
                      aria-label="Show history"
                    >
                      <HistoryIcon className="w-5 h-5 text-white" />
                    </button>
                    {revealedHistory && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3 z-50 text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { 0% { opacity: 0; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
                        <p><strong className="font-semibold text-slate-200">Created:</strong> <span className="text-slate-400">{formatDate(student.createdDate)}</span></p>
                        <p className="mt-1"><strong className="font-semibold text-slate-200">Updated:</strong> <span className="text-slate-400">{formatDate(student.lastModifiedDate)}</span></p>
                      </div>
                    )}
                  </div>
                )}
            </div>
            </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700 overflow-x-auto">
        <nav className="-mb-px flex gap-x-6 gap-y-2" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              } whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'Details' && (
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700 lg:col-span-5">
                        <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-4 mb-6">Student Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Follow-up Date">
                                <div className="flex items-center text-blue-400 font-medium">
                                    <span>{formatDate(editableStudent.followUpDate)}</span>
                                    <button onClick={() => onEditFollowUp(student)} className="ml-2 text-slate-400 hover:text-blue-400 transition-colors" aria-label="Edit Follow-up Date">
                                        <CalendarIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </DetailItem>
                            <DetailItem label="Lead Status">
                                <select
                                    value={editableStudent.leadStatus}
                                    onChange={(e) => onUpdateLeadStatus(student.id, e.target.value as LeadStatus)}
                                    className="px-2.5 py-1 text-sm font-semibold rounded-full border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {['New', 'In Follow-up', 'Converted', 'Lost', 'Finalised'].map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </DetailItem>
                            <DetailItem label="Assigned User">
                                <div className="flex justify-center items-center">
                                <select
                                    value={editableStudent.assignedUserId || ''}
                                    onChange={(e) => {
                                        const newAssignedUserId = e.target.value;
                                        const updated = { ...editableStudent, assignedUserId: newAssignedUserId };
                                        setEditableStudent(updated);
                                        onUpdateStudent(updated);
                                    }}
                                    className="w-full max-w-md px-2.5 py-1 text-sm font-semibold text-center rounded-full border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Unassigned</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                    ))}
                                </select>
                                </div>
                            </DetailItem>
                            <DetailItem label="Service Category">
                                 <select
                                    value={editableStudent.serviceCategory}
                                    onChange={(e) => onUpdateServiceCategory(student.id, e.target.value as ServiceCategory)}
                                    className="px-2.5 py-1 text-sm font-semibold rounded-full border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {['Document Editing', 'Abroad Education', 'Domestic Education', 'Visa Support', 'Test Prep', 'Profile Building', 'Education Loan', 'Other'].map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </DetailItem>
                            <DetailItem label="Preferred Countries">
                                <div className="flex items-center space-x-2 flex-wrap gap-2">
                                    {editableStudent.preferredCountries.map((country) => (
                                        <span key={country} className="px-2.5 py-1 text-xs font-semibold bg-slate-700 text-slate-200 rounded-md">
                                        {country}
                                        </span>
                                    ))}
                                    <button onClick={() => onEditCountries(student)} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Edit Preferred Countries">
                                        <EditIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </DetailItem>
                            <DetailItem label="Prospect">
                                <select
                                    value={editableStudent.extendedDetails?.prospect || ''}
                                    onChange={(e) => onUpdateStudent({ ...editableStudent, extendedDetails: { ...editableStudent.extendedDetails, prospect: e.target.value as any } })}
                                    className="px-2.5 py-1 text-sm font-semibold rounded-full border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select...</option>
                                    {['Hot', 'Warm', 'Cold'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </DetailItem>
                            <DetailItem label="Passport">
                                <select
                                    value={editableStudent.extendedDetails?.passport || ''}
                                    onChange={(e) => onUpdateStudent({ ...editableStudent, extendedDetails: { ...editableStudent.extendedDetails, passport: e.target.value as any } })}
                                    className="px-2.5 py-1 text-sm font-semibold rounded-full border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select...</option>
                                    {['Yes', 'No', 'Applied', 'Not Required'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </DetailItem>
                            <DetailItem label="Expected Conversion">
                                <div className="relative w-48">
                                    <input
                                        type="date"
                                        value={editableStudent.extendedDetails?.expectedConversion || ''}
                                        onChange={(e) => onUpdateStudent({ ...editableStudent, extendedDetails: { ...editableStudent.extendedDetails, expectedConversion: e.target.value } })}
                                        className="w-full px-2.5 py-1 text-sm font-semibold rounded-full border border-slate-600 bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <CalendarIcon className="absolute right-3 top-1.5 w-4 h-4 text-blue-400 pointer-events-none" />
                                </div>
                            </DetailItem>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700 lg:col-span-3">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Contact Details</h2>
                            {isContactEditing ? (
                                <button
                                    onClick={() => {
                                        setIsContactEditing(false);
                                        onUpdateStudent(editableStudent);
                                    }}
                                    className="text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0"
                                    aria-label="Save contact details"
                                >
                                    <SaveIcon className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsContactEditing(true)}
                                    className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                                    aria-label="Edit contact details"
                                >
                                    <EditIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-300 mb-2 border-b border-slate-700 pb-2">Student Contact</h3>
                                {isContactEditing ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-slate-400 block mb-1">Mobile</label>
                                            <input type="tel" value={editableStudent.mobile} onChange={e => handleStudentChange('mobile', e.target.value)} className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-400 block mb-1">Email</label>
                                            <input type="email" value={editableStudent.email} onChange={e => handleStudentChange('email', e.target.value)} className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <button ref={phoneTriggerRef} onClick={() => handlePopoverToggle('phone')} className="w-16 h-16 flex items-center justify-center bg-slate-700 rounded-full text-slate-200 hover:bg-slate-600 transition-colors" aria-label="Show phone number">
                                                <PhoneIcon className="w-6 h-6" />
                                            </button>
                                            {popoverOpen === 'phone' && (
                                                <div ref={popoverRef} className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max bg-slate-800 text-white rounded-md shadow-lg p-2 flex items-center gap-3 z-10 border border-slate-700">
                                                    <span className="text-xs font-medium font-mono">{editableStudent.mobile}</span>
                                                    <button onClick={() => handleCopy(editableStudent.mobile, 'phone')} className="text-slate-400 hover:text-white">
                                                        {copied === 'phone' ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <button ref={emailTriggerRef} onClick={() => handlePopoverToggle('email')} className="w-16 h-16 flex items-center justify-center bg-slate-700 rounded-full text-slate-200 hover:bg-slate-600 transition-colors" aria-label="Show email address">
                                                <EmailIcon className="w-6 h-6" />
                                            </button>
                                            {popoverOpen === 'email' && (
                                                <div ref={popoverRef} className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max bg-slate-800 text-white rounded-md shadow-lg p-2 flex items-center gap-3 z-10 border border-slate-700">
                                                    <span className="text-xs font-medium font-mono">{editableStudent.email}</span>
                                                    <button onClick={() => handleCopy(editableStudent.email, 'email')} className="text-slate-400 hover:text-white">
                                                        {copied === 'email' ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-300 mb-2 border-b border-slate-700 pb-2">Emergency Contact</h3>
                                <div className="grid grid-cols-1 gap-y-3">
                                    {isContactEditing ? (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium text-slate-400 block mb-1">Full Name</label>
                                                <input type="text" value={editableStudent.emergencyContact?.name || ''} onChange={e => handleEmergencyContactChange('name', e.target.value)} className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-400 block mb-1">Email ID</label>
                                                <input type="email" value={editableStudent.emergencyContact?.email || ''} onChange={e => handleEmergencyContactChange('email', e.target.value)} className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-400 block mb-1">Number</label>
                                                <input type="tel" value={editableStudent.emergencyContact?.phone || ''} onChange={e => handleEmergencyContactChange('phone', e.target.value)} className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-400 block mb-1">Relation</label>
                                                <input type="text" value={editableStudent.emergencyContact?.relation || ''} onChange={e => handleEmergencyContactChange('relation', e.target.value)} className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-sm"><span className="font-medium text-slate-500 block">Full Name</span><span className="text-slate-200 truncate">{editableStudent.emergencyContact?.name || 'N/A'}</span></div>
                                            <div className="text-sm"><span className="font-medium text-slate-500 block">Email ID</span><span className="text-slate-200 truncate">{editableStudent.emergencyContact?.email || 'N/A'}</span></div>
                                            <div className="text-sm"><span className="font-medium text-slate-500 block">Number</span><span className="text-slate-200 truncate">{editableStudent.emergencyContact?.phone || 'N/A'}</span></div>
                                            <div className="text-sm"><span className="font-medium text-slate-500 block">Relation</span><span className="text-slate-200 truncate">{editableStudent.emergencyContact?.relation || 'N/A'}</span></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700 lg:col-span-4">
                        <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-4 mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Collaborate Users
                        </h2>
                        <div className="space-y-4">
                            <div ref={collabDropdownRef} className="relative">
                                <label className="text-sm font-medium text-slate-400 block mb-2">Add Collaborator</label>
                                <button
                                    onClick={() => setIsCollabDropdownOpen(!isCollabDropdownOpen)}
                                    className="w-full px-3 py-2 text-sm text-left rounded-lg border border-slate-600 bg-slate-900 text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Select a user...
                                </button>
                                {isCollabDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden no-scrollbar">
                                        {employees.filter(emp => !editableStudent.collaborators?.some(c => c.userId === emp.id)).map(emp => (
                                            <div
                                                key={emp.id}
                                                className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-slate-200 transition-colors border-b border-slate-700/50 last:border-0"
                                                onClick={() => {
                                                    const newCollaborators = [...(editableStudent.collaborators || []), { userId: emp.id, status: 'Not Started Yet' as const }];
                                                    const updated = { ...editableStudent, collaborators: newCollaborators };
                                                    setEditableStudent(updated);
                                                    onUpdateStudent(updated);
                                                    setIsCollabDropdownOpen(false);
                                                }}
                                            >
                                                <div className="text-sm font-medium">{emp.fullName}</div>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {emp.roleCategory || emp.role || 'Employee'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {emp.organisationName || 'SilverCorp EdTech'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {employees.filter(emp => !editableStudent.collaborators?.some(c => c.userId === emp.id)).length === 0 && (
                                            <div className="px-3 py-2 text-sm text-slate-500">No more users to add.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 mt-4">
                                {editableStudent.collaborators?.map(collab => {
                                    const emp = employees.find(e => e.id === collab.userId);
                                    if (!emp) return null;
                                    return (
                                        <div key={collab.userId} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700 transition">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                                                        {emp.fullName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-200">{emp.fullName}</span>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{emp.roleCategory || emp.role || 'Employee'}</span>
                                                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{emp.organisationName || 'SilverCorp EdTech'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newCollaborators = editableStudent.collaborators?.filter(c => c.userId !== collab.userId) || [];
                                                        const updated = { ...editableStudent, collaborators: newCollaborators };
                                                        setEditableStudent(updated);
                                                        onUpdateStudent(updated);
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-md transition"
                                                    title="Remove Collaborator"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-slate-500">Status:</span>
                                                <select
                                                    value={collab.status}
                                                    onChange={(e) => {
                                                        const newCollaborators = editableStudent.collaborators?.map(c => 
                                                            c.userId === collab.userId ? { ...c, status: e.target.value as any } : c
                                                        ) || [];
                                                        const updated = { ...editableStudent, collaborators: newCollaborators };
                                                        setEditableStudent(updated);
                                                        onUpdateStudent(updated);
                                                    }}
                                                    className="bg-slate-800 border border-slate-600 text-xs rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="Not Started Yet">Not Started Yet</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Canceled">Canceled</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!editableStudent.collaborators || editableStudent.collaborators.length === 0) && (
                                    <div className="text-sm text-slate-500 text-center py-4">
                                        No collaborators added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <StudentExtendedForm student={editableStudent} onUpdate={onUpdateStudent} />
                </div>
            </div>
        )}
        {activeTab === 'Journey' && <JourneyFlowchart student={editableStudent} onUpdateStudent={onUpdateStudent} currentUser={currentUser} />}
        {activeTab === 'Documents' && (
            <DocumentsTab 
                documents={documents}
                onAddDocuments={handleAddDocuments}
                onRemoveDocument={handleRemoveDocument}
                onUploadDocument={handleUploadDocument}
            />
        )}
        {activeTab === 'Tasks' && (
          <TasksTab
            tasks={tasks}
            onSaveTask={handleSaveTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            employees={employees}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'Notes' && <NotesTab notes={notes} onAddNote={handleAddNote} />}
        {activeTab === 'Important Credentials' && (
            <CredentialsTab 
                credentials={credentials}
                onAdd={handleAddCredential}
                onUpdate={handleUpdateCredential}
                onDelete={handleDeleteCredential}
            />
        )}
        {activeTab === 'Change History' && <ChangeHistoryTab history={editableStudent.history || []} />}
      </div>
    </div>
  );
};