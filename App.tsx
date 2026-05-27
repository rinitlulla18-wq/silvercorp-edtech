import React, { useState, useEffect, useMemo } from 'react';
import { LeadStatus, Student, ChatMessage, FollowUpFilter, ServiceCategory, User, UserTask, Note, HistoryEntry, StudentExtendedDetails } from './types';
import { api } from './src/api';
import { allCountries } from './data/countries';
import { Header } from './components/Header';
import { FilterBar } from './components/SearchBar';
import { StudentTable } from './components/StudentTable';
import { Dashboard } from './components/Dashboard';
import { StudentPage } from './components/StudentPage';
import { AdminTool } from './components/AdminTool';
import { EditCountriesModal } from './components/EditCountriesModal';
import { EditFollowUpModal } from './components/EditFollowUpModal';
import { ChatHistoryModal } from './components/ChatHistoryModal';
import { ExportModal } from './components/ExportModal';
import { AddLeadModal } from './components/AddLeadModal';
import { LoginPage } from './components/LoginPage';
import { UserTasksTab } from './components/UserTasksTab';
import { AttendanceModal } from './components/AttendanceModal';

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'followUpDate';
interface SortConfig {
    key: SortableKeys;
    direction: SortDirection;
}

type ViewMode = 'dashboard' | 'leads' | 'tasks' | 'detail' | 'admin';

const App: React.FC = () => {
  const [adminUser, setAdminUser] = useState<User>({
    id: 'USR-2026-001',
    fullName: 'SilverCorp Admin',
    email: 'admin@silvercorp.com',
    password: 'admin123',
    mobile: '+91 98765 43210',
    homeAddress: '123, Tech Park, Sector 62, Noida, UP, India',
    emergencyContact: '+91 99999 88888 (Manager)',
    avatarUrl: `https://picsum.photos/seed/admin/100/100`,
    role: 'admin'
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('silvercorp_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<UserTask[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [openStudents, setOpenStudents] = useState<Student[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatus | ''>('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<ServiceCategory | ''>('');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>('');
  
  // Modal states
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [editingCountriesStudent, setEditingCountriesStudent] = useState<Student | null>(null);
  const [editingFollowUpStudent, setEditingFollowUpStudent] = useState<Student | null>(null);
  const [viewingChatStudent, setViewingChatStudent] = useState<Student | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem('silvercorp_logo') || '');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [addLeadModalInitialTab, setAddLeadModalInitialTab] = useState<'manual' | 'excel'>('manual');
  const [tabLimitNotification, setTabLimitNotification] = useState<string | null>(null);
  const [studentOrder, setStudentOrder] = useState<number[]>([]);
  const [showDailyAttendancePopup, setShowDailyAttendancePopup] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (user) {
      const today = new Date().toDateString();
      const lastShown = localStorage.getItem(`attendance_popup_last_shown_${user.id}`);
      if (lastShown !== today) {
        setShowDailyAttendancePopup(true);
        localStorage.setItem(`attendance_popup_last_shown_${user.id}`, today);
      }
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, selectedStudent?.id]);

  // Inactivity logout (20 minutes)
  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        // Using a custom notification or just logging out
        setTabLimitNotification('Logged out due to no activity.');
        setTimeout(() => setTabLimitNotification(null), 5000);
      }, 20 * 60 * 1000); // 20 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Initialize timer

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  // Session persistence (8 hours)
  useEffect(() => {
    const session = localStorage.getItem('silvercorp_session');
    if (session) {
      try {
        const { email, expiry } = JSON.parse(session);
        if (new Date().getTime() < expiry) {
          if (email.toLowerCase() === adminUser.email.toLowerCase()) {
            setUser(adminUser);
          } else {
            // We need to wait for employees to load, or load them here
            const savedEmployees = localStorage.getItem('silvercorp_employees');
            if (savedEmployees) {
              const parsedEmployees: User[] = JSON.parse(savedEmployees);
              const emp = parsedEmployees.find(e => e.email.toLowerCase() === email.toLowerCase());
              if (emp) setUser(emp);
            }
          }
          setCurrentView('dashboard');
        } else {
          localStorage.removeItem('silvercorp_session');
        }
      } catch (e) {
        localStorage.removeItem('silvercorp_session');
      }
    }
  }, [adminUser]);

  // Fetch Employees
  useEffect(() => {
    if (user && user.role) {
      api.fetchEmployees(user.id, user.role).then(setEmployees).catch(console.error);
    }
  }, [user, refreshKey]);

  // Server-side paginated student fetch — re-runs whenever filters/page/user change
  useEffect(() => {
    // Wait until user is resolved from session before fetching
    if (!user) return;
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const sortKey = sortConfig?.key === 'followUpDate' ? 'followUpDate'
          : sortConfig?.key === 'fullName' ? 'fullName'
          : 'lastModifiedDate';
        const sortDir = sortConfig?.direction === 'ascending' ? 'asc' : 'desc';

        const result = await api.fetchStudents({
          page:     currentPage,
          limit:    PAGE_SIZE,
          search:   searchQuery || undefined,
          status:   leadStatusFilter || undefined,
          service:  serviceCategoryFilter || undefined,
          assigned: assignedUserFilter || undefined,
          sort:     sortKey,
          dir:      sortDir,
          requesterUserId: user?.id,
          requesterRole:   user?.role,
        });
        setStudents(result.rows);
        setTotalStudents(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('[App] Failed to load students after retries:', error);
        // Keep isLoadingStudents=false so the "No students found" state is shown
        // with a hint that the server may still be warming up
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadStudents();
  }, [user, currentPage, searchQuery, leadStatusFilter, serviceCategoryFilter, assignedUserFilter, sortConfig, refreshKey]);

  // Fetch Dashboard Stats
  useEffect(() => {
    if (user && currentView === 'dashboard') {
      api.fetchStats(user.id, user.role).then(setDashboardStats).catch(console.error);
    }
  }, [user, currentView]);

  // Reset to page 1 when filters change (but not page itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, leadStatusFilter, serviceCategoryFilter, assignedUserFilter, sortConfig]);

  const nextStudentId = useMemo(() => {
    const year = new Date().getFullYear().toString().slice(-2); // "26"
    const prefix = `SC${year}`;
    
    if (students.length === 0) return `${prefix}000001`;
    
    const yearStudents = students.filter(s => s.studentId.startsWith(prefix));
    if (yearStudents.length === 0) return `${prefix}000001`;

    const maxId = yearStudents.reduce((max, s) => {
        const idNum = parseInt(s.studentId.replace(prefix, ''), 10);
        return idNum > max ? idNum : max;
    }, 0);
    
    return `${prefix}${(maxId + 1).toString().padStart(6, '0')}`;
  }, [students]);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setHours(0,0,0,0);
        return new Date(d.setDate(diff));
    }
    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    const filtered = students.filter(student => {
      const matchesSearch = (() => {
        if (!searchQuery.trim()) return true;
        
        const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const studentSearchableText = [
          student.fullName,
          student.studentId,
          student.email,
          student.mobile,
          student.notes,
          student.serviceCategory,
        ].join(' ').toLowerCase();

        return queryTerms.every(term => studentSearchableText.includes(term));
      })();
      
      const matchesCountry = 
        selectedCountries.length === 0 || 
        student.preferredCountries.some(country => selectedCountries.includes(country));

      const matchesLeadStatus =
        leadStatusFilter === '' || student.leadStatus === leadStatusFilter;
      
      const matchesServiceCategory =
        serviceCategoryFilter === '' || student.serviceCategory === serviceCategoryFilter;

      const matchesFollowUpDate = (() => {
        if (followUpFilter === 'all') return true;
        
        const isNotRequired = student.leadStatus === 'Lost' || !student.followUpDate;

        if (followUpFilter === 'not_required') {
            return isNotRequired;
        }

        if (isNotRequired) return false;

        const followUpDate = new Date(student.followUpDate!);
        followUpDate.setHours(0,0,0,0);
        
        switch(followUpFilter) {
            case 'overdue':
                return followUpDate < today;
            case 'today':
                return followUpDate.getTime() === today.getTime();
            case 'in_a_week':
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                return followUpDate >= today && followUpDate <= nextWeek;
            default:
                return true;
        }
      })();

      const matchesAssignedUser = (() => {
        if (user?.role === 'admin') {
          if (assignedUserFilter === '') return true;
          if (assignedUserFilter === 'unassigned') return !student.assignedUserId;
          return student.assignedUserId === assignedUserFilter;
        } else {
          // Employee: See assigned leads OR leads where they are a collaborator
          const isAssigned = student.assignedUserId === user?.id;
          const isCollaborator = student.collaborators?.some(c => c.userId === user?.id);
          
          if (searchQuery.trim() !== '') {
            // If searching, still restricted to assigned or collaborated
            return isAssigned || isCollaborator;
          }
          // Otherwise, only see their own or collaborated
          return isAssigned || isCollaborator;
        }
      })();

      return matchesSearch && matchesCountry && matchesLeadStatus && matchesServiceCategory && matchesFollowUpDate && matchesAssignedUser;
    });

    const studentsToSort = [...filtered];

    const getPriorityScore = (student: Student): number => {
        const isNotRequired = student.leadStatus === 'Lost' || !student.followUpDate;
        if (isNotRequired) return 100; // Always at bottom

        if (student.leadStatus === 'New') return 1;

        const followUpDate = new Date(student.followUpDate!);
        followUpDate.setHours(0,0,0,0);
        
        if (followUpDate < today) return 2;
        if (followUpDate.getTime() === today.getTime()) return 3;
        return 4; // Upcoming
    };

    if (sortConfig?.key === 'followUpDate') {
        studentsToSort.sort((a, b) => {
            const priorityA = getPriorityScore(a);
            const priorityB = getPriorityScore(b);

            // Keep "Not Required" at the bottom regardless of sort direction
            if (priorityA === 100 && priorityB !== 100) return 1;
            if (priorityA !== 100 && priorityB === 100) return -1;

            const dateA = a.followUpDate ? new Date(a.followUpDate) : null;
            const dateB = b.followUpDate ? new Date(b.followUpDate) : null;

            if (dateA === null && dateB === null) return 0;
            if (dateA === null) return 1;
            if (dateB === null) return -1;

            if (sortConfig.direction === 'ascending') {
                const diff = dateA.getTime() - dateB.getTime();
                if (diff !== 0) return diff;
            } else {
                const diff = dateB.getTime() - dateA.getTime();
                if (diff !== 0) return diff;
            }

            // Tie-breaker: lastModifiedDate descending
            const modA = new Date(a.lastModifiedDate).getTime();
            const modB = new Date(b.lastModifiedDate).getTime();
            return modB - modA;
        });
    } else {
        // Default sorting logic
        studentsToSort.sort((a, b) => {
            const priorityA = getPriorityScore(a);
            const priorityB = getPriorityScore(b);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Tie-breaker: lastModifiedDate descending
            const modA = new Date(a.lastModifiedDate).getTime();
            const modB = new Date(b.lastModifiedDate).getTime();
            return modB - modA;
        });
    }

    return studentsToSort;
  }, [searchQuery, selectedCountries, leadStatusFilter, serviceCategoryFilter, followUpFilter, assignedUserFilter, sortConfig, students, user]);

  useEffect(() => {
    setStudentOrder(filtered.map(s => s.id));
  }, [filtered]);

  // With server-side pagination and local filtering
  const sortedStudents = filtered;

  const handleSort = (key: SortableKeys) => {
    setSortConfig(currentSortConfig => {
        if (!currentSortConfig || currentSortConfig.key !== key) {
            return { key, direction: 'ascending' };
        }
        if (currentSortConfig.direction === 'ascending') {
            return { key, direction: 'descending' };
        }
        return null;
    });
  };

  const handleOpenEditCountriesModal = (student: Student) => {
    setEditingCountriesStudent(student);
  };

  const handleCloseEditCountriesModal = () => {
    setEditingCountriesStudent(null);
  };

  const addHistoryEntry = (student: Student, type: HistoryEntry['type'], description: string): Student => {
    const newEntry: HistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      user: user?.fullName || 'SilverCorp Admin',
      timestamp: new Date().toISOString(),
      description,
    };
    return {
      ...student,
      history: [newEntry, ...(student.history || [])],
      lastModifiedDate: newEntry.timestamp,
    };
  };

  const handleSaveCountries = (studentId: number, newCountries: string[]) => {
    setStudents(currentStudents =>
      currentStudents.map(s => {
        if (s.id === studentId) {
            const description = `Preferred Countries | Countries Tab | Preferred Countries updated to ${newCountries.join(', ') || 'None'}.`;
            const studentWithHistory = addHistoryEntry(s, 'countries', description);
            return { ...studentWithHistory, preferredCountries: newCountries };
        }
        return s;
      })
    );
    setEditingCountriesStudent(null);
  };

  const handleOpenEditFollowUpModal = (student: Student) => {
    setEditingFollowUpStudent(student);
  };

  const handleCloseEditFollowUpModal = () => {
    setEditingFollowUpStudent(null);
  };

  const handleSaveFollowUp = async (studentId: number, newDate: string, comment: string = '') => {
    const now = new Date().toISOString();
    const formattedDateTime = new Date().toLocaleString();
    const safeComment = comment || '';
    
    const s = students.find(student => student.id === studentId);
    if (!s) return;

    let updatedDetailedNotes = [...s.detailedNotes];
    let updatedChatHistory = [...s.chatHistory];
    
    if (safeComment.trim()) {
        const noteText = `Followup added by user on ${formattedDateTime}: ${safeComment}`;
        
        const newNote: Note = {
            id: Date.now(),
            author: 'User',
            authorInitials: 'U',
            avatarBgColor: 'bg-blue-500',
            avatarTextColor: 'text-white',
            timestamp: now,
            text: noteText
        };
        updatedDetailedNotes = [newNote, ...updatedDetailedNotes];

        const newChatMessage: ChatMessage = {
            id: Date.now() + 1,
            sender: 'agent',
            text: noteText,
            timestamp: now,
            userName: 'User'
        };
        updatedChatHistory = [...updatedChatHistory, newChatMessage];
    }

    const description = `Follow-up | Follow-up Tab | Follow-up Date rescheduled to '${new Date(newDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}'. ${safeComment.trim() ? `Note: "${safeComment.trim()}"` : ''}`;
    const studentWithHistory = addHistoryEntry(s, 'date', description);

    const updatedStudent = { 
        ...studentWithHistory, 
        followUpDate: newDate, 
        detailedNotes: updatedDetailedNotes,
        chatHistory: updatedChatHistory,
        notes: safeComment.trim() || s.notes
    };

    // Optimistic update
    setStudents(currentStudents =>
        currentStudents.map(student => student.id === studentId ? updatedStudent : student)
    );

    try {
        await api.updateStudent(studentId, updatedStudent);
    } catch (error) {
        console.error('Failed to update follow-up:', error);
        alert('Failed to save changes to database. Please refresh.');
    }

    setEditingFollowUpStudent(null);
  };
  
  const handleUpdateLeadStatus = async (studentId: number, newStatus: LeadStatus) => {
    const now = new Date().toISOString();
    const s = students.find(student => student.id === studentId);
    if (!s) return;

    const statusChangeMessage: ChatMessage = {
        id: Date.now(),
        sender: 'agent',
        text: `Lead status changed to "${newStatus}".`,
        timestamp: now,
        isFlagged: false,
        userName: user?.fullName || 'SilverCorp Admin',
    };

    const description = `Lead Status | Lead Status Dropdown | Lead Status changed from '${s.leadStatus}' to '${newStatus}'.`;
    const studentWithHistory = addHistoryEntry(s, 'status', description);

    const updatedStudent = { 
        ...studentWithHistory, 
        leadStatus: newStatus, 
        notes: `Status set to ${newStatus}.`,
        chatHistory: [...s.chatHistory, statusChangeMessage]
    };

    // Optimistic update
    setStudents(currentStudents => 
        currentStudents.map(student => student.id === studentId ? updatedStudent : student)
    );

    try {
        await api.updateStudent(studentId, updatedStudent);
    } catch (error) {
        console.error('Failed to update lead status:', error);
        alert('Failed to update status in database.');
    }
  };

  const handleUpdateAssignedUser = async (studentId: number, newUserId: string) => {
    const now = new Date().toISOString();
    const s = students.find(student => student.id === studentId);
    if (!s) return;

    const assignedUser = employees.find(emp => emp.id === newUserId);
    const oldAssignedUser = employees.find(emp => emp.id === s.assignedUserId);
    const newName = assignedUser ? assignedUser.fullName : 'Unassigned';
    const oldName = oldAssignedUser ? oldAssignedUser.fullName : 'Unassigned';

    const assignmentChangeMessage: ChatMessage = {
        id: Date.now(),
        sender: 'agent',
        text: `Assigned user changed to "${newName}".`,
        timestamp: now,
        isFlagged: false,
        userName: user?.fullName || 'SilverCorp Admin',
    };

    const description = `Assigned User | Assigned User Dropdown | Assigned User changed from '${oldName}' to '${newName}'.`;
    const studentWithHistory = addHistoryEntry(s, 'general', description);

    const updatedStudent = { 
        ...studentWithHistory, 
        assignedUserId: newUserId || undefined,
        lastModifiedDate: now,
        chatHistory: [...studentWithHistory.chatHistory, assignmentChangeMessage]
    };

    // Optimistic update
    setStudents(currentStudents => 
        currentStudents.map(student => student.id === studentId ? updatedStudent : student)
    );

    try {
        await api.updateStudent(studentId, updatedStudent);
    } catch (error) {
        console.error('Failed to update assigned user:', error);
        alert('Failed to update assignment in database.');
    }
  };

  const handleUpdateServiceCategory = async (studentId: number, newCategory: ServiceCategory) => {
    const now = new Date().toISOString();
    const s = students.find(student => student.id === studentId);
    if (!s) return;

    const categoryChangeMessage: ChatMessage = {
        id: Date.now(),
        sender: 'agent',
        text: `Service category changed to "${newCategory}".`,
        timestamp: now,
        isFlagged: false,
        userName: user?.fullName || 'SilverCorp Admin',
    };

    const description = `Service Category | Service Category Dropdown | Service Category changed from '${s.serviceCategory}' to '${newCategory}'.`;
    const studentWithHistory = addHistoryEntry(s, 'service', description);

    const updatedStudent = { 
        ...studentWithHistory, 
        serviceCategory: newCategory, 
        chatHistory: [...s.chatHistory, categoryChangeMessage]
    };

    // Optimistic update
    setStudents(currentStudents => 
        currentStudents.map(student => student.id === studentId ? updatedStudent : student)
    );

    try {
        await api.updateStudent(studentId, updatedStudent);
    } catch (error) {
        console.error('Failed to update service category:', error);
        alert('Failed to update category in database.');
    }
  };
  
  const handleOpenChatModal = (student: Student) => {
    setViewingChatStudent(student);
  };

  const handleCloseChatModal = () => {
    setViewingChatStudent(null);
  };

  const handleAddChatMessage = async (studentId: number, messageText: string) => {
    const now = new Date().toISOString();
    const formattedDateTime = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const s = students.find(student => student.id === studentId);
    if (!s) return;

    const noteWithStatus = `(Status: ${s.leadStatus}) ${messageText}`;
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: 'agent',
      text: noteWithStatus,
      timestamp: now,
      isFlagged: false,
      userName: user?.fullName || 'SilverCorp Admin',
    };

    // Sync with Notes tab
    const newNote: Note = {
      id: Date.now() + 1,
      author: user?.fullName || 'User',
      authorInitials: (user?.fullName || 'U').split(' ').map(n => n[0]).join(''),
      avatarBgColor: 'bg-blue-500',
      avatarTextColor: 'text-white',
      timestamp: formattedDateTime,
      text: messageText
    };

    const description = `Conversation History | Note added: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`;
    const studentWithHistory = addHistoryEntry(s, 'note', description);

    const updatedStudent = {
      ...studentWithHistory,
      chatHistory: [...s.chatHistory, newMessage],
      detailedNotes: [newNote, ...s.detailedNotes],
      notes: messageText, 
      lastModifiedDate: now,
    };

    // Optimistic update
    setStudents(currentStudents =>
        currentStudents.map(student => student.id === studentId ? updatedStudent : student)
    );

    try {
        await api.updateStudent(studentId, updatedStudent);
    } catch (error) {
        console.error('Failed to add chat message:', error);
        alert('Failed to save message in database.');
    }
  };
  
  const handleToggleFlagMessage = (studentId: number, messageId: number) => {
    const now = new Date().toISOString();
    setStudents(currentStudents =>
      currentStudents.map(s => {
        if (s.id === studentId) {
            let isNowFlagged: boolean | undefined;
            const updatedChatHistoryWithoutSystemMessage = s.chatHistory.map(m => {
                if (m.id === messageId) {
                    isNowFlagged = !m.isFlagged;
                    return { ...m, isFlagged: isNowFlagged };
                }
                return m;
            });

            if (isNowFlagged === undefined) return s;

            const systemMessage: ChatMessage = {
                id: Date.now(),
                sender: 'system',
                text: isNowFlagged ? `Message flagged for admin review.` : `Message unflagged.`,
                timestamp: now,
            };
            
            const updatedStudent = {
                ...s,
                chatHistory: [...updatedChatHistoryWithoutSystemMessage, systemMessage],
                lastModifiedDate: now,
            };

            return updatedStudent;
        }
        return s;
      })
    );
  };

  // Sync selectedStudent and viewingChatStudent with students array
  useEffect(() => {
    if (selectedStudent) {
      const updated = students.find(s => s.id === selectedStudent.id);
      if (updated && updated.lastModifiedDate !== selectedStudent.lastModifiedDate) {
        setSelectedStudent(updated);
      }
    }
  }, [students, selectedStudent]);

  useEffect(() => {
    if (viewingChatStudent) {
      const updated = students.find(s => s.id === viewingChatStudent.id);
      if (updated && updated.lastModifiedDate !== viewingChatStudent.lastModifiedDate) {
        setViewingChatStudent(updated);
      }
    }
  }, [students, viewingChatStudent]);

  const handleOpenExportModal = () => setIsExportModalOpen(true);
  const handleCloseExportModal = () => setIsExportModalOpen(false);

  const handleExportData = (
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
  ) => {
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);

    const dataToExport = sortedStudents.filter(student => {
        const created = new Date(student.createdDate);
        return created >= start && created <= end;
    });

    if (dataToExport.length === 0) {
        alert("No student data found for the selected filters and date range.");
        return;
    }

    const headers: string[] = ["Student ID", "Full Name", "Email", "Mobile"];
    if (options.leadStatus) headers.push("Lead Status");
    if (options.serviceCategory) headers.push("Service Category");
    if (options.preferredCountries) headers.push("Preferred Countries");
    if (options.assignedUser) headers.push("Assigned User");
    if (options.followUpDate) headers.push("Follow-up Date");
    if (options.notes) headers.push("Notes");
    headers.push("Created Date", "Last Modified Date");

    const escapeCsvCell = (cellData: string) => {
        if (/[",\n]/.test(cellData)) {
            return `"${cellData.replace(/"/g, '""')}"`;
        }
        return cellData;
    };

    const rows = dataToExport.map(s => {
        const row: (string | undefined)[] = [
            s.studentId,
            escapeCsvCell(s.fullName),
            s.email,
            s.mobile,
        ];
        if (options.leadStatus) row.push(s.leadStatus);
        if (options.serviceCategory) row.push(s.serviceCategory);
        if (options.preferredCountries) row.push(escapeCsvCell(s.preferredCountries.join(', ')));
        if (options.assignedUser) {
            const assignedUser = employees.find(emp => emp.id === s.assignedUserId);
            row.push(assignedUser ? escapeCsvCell(assignedUser.fullName) : 'Unassigned');
        }
        if (options.followUpDate) row.push(s.followUpDate || 'N/A');
        if (options.notes) row.push(escapeCsvCell(s.notes));
        
        row.push(
            new Date(s.createdDate).toLocaleString(),
            new Date(s.lastModifiedDate).toLocaleString()
        );

        return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `students_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleCloseExportModal();
  };
  
  const handleOpenImportModal = () => {
      setAddLeadModalInitialTab('excel');
      setIsAddLeadModalOpen(true);
  };
  const handleOpenAddLeadModal = () => {
      setAddLeadModalInitialTab('manual');
      setIsAddLeadModalOpen(true);
  };
  const handleCloseAddLeadModal = () => setIsAddLeadModalOpen(false);

  const handleUpdateLogo = (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
    localStorage.setItem('silvercorp_logo', newLogoUrl);
  };

  const handleSaveNewLead = async (newLeadData: { fullName: string; email: string; mobile: string; followUpDate: string; serviceCategory: ServiceCategory; assignedUserId?: string; }) => {
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    
    // We'll let the backend assign the numeric ID
    const newStudent: any = {
        studentId: nextStudentId,
        fullName: newLeadData.fullName,
        email: newLeadData.email,
        mobile: newLeadData.mobile,
        followUpDate: newLeadData.followUpDate || todayStr,
        preferredCountries: [],
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/40/40`,
        notes: 'New lead created.',
        leadStatus: 'New',
        serviceCategory: newLeadData.serviceCategory,
        assignedUserId: newLeadData.assignedUserId,
        createdDate: now,
        lastModifiedDate: now,
        chatHistory: [{
            id: Date.now(),
            sender: 'agent',
            text: `New lead created under "${newLeadData.serviceCategory}".`,
            timestamp: now,
            isFlagged: false,
            userName: user?.fullName || 'SilverCorp Admin',
        }],
        emergencyContact: { name: '', email: '', phone: '', relation: '' },
        credentials: [],
        documents: [],
        tasks: [],
        detailedNotes: [],
        history: [{
            id: `hist-${Date.now()}`,
            type: 'general',
            user: user?.fullName || 'SilverCorp Admin',
            timestamp: now,
            description: 'Lead created.'
        }],
        completedJourneySteps: []
    };

    try {
        const { id } = await api.createStudent(newStudent);
        setStudents(prev => [{ ...newStudent, id }, ...prev]);
        handleCloseAddLeadModal();
    } catch (error) {
        console.error('Failed to save lead:', error);
    }
  };

  const handleSaveNewLeadsBatch = async (newLeadsData: { fullName: string; email: string; mobile: string; followUpDate: string; serviceCategory: ServiceCategory; assignedUserId?: string; }[]) => {
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    
    // We'll iterate and save each one to the database
    let currentStudentIdNum = parseInt(nextStudentId.replace('SC', ''), 10);

    // Use Promise.all to save leads in parallel (much faster)
    const savePromises = newLeadsData.map(async (leadData, i) => {
        const studentIdStr = `SC${currentStudentIdNum + i}`;
        
        const newStudentData: any = {
            studentId: studentIdStr,
            fullName: leadData.fullName,
            email: leadData.email,
            mobile: leadData.mobile,
            followUpDate: leadData.followUpDate || todayStr,
            preferredCountries: [],
            avatarUrl: `https://picsum.photos/seed/${Date.now() + i}/40/40`,
            notes: 'New lead imported via Excel.',
            leadStatus: 'New',
            serviceCategory: leadData.serviceCategory,
            assignedUserId: leadData.assignedUserId,
            createdDate: now,
            lastModifiedDate: now,
            chatHistory: [{
                id: Date.now() + i,
                sender: 'agent',
                text: `New lead imported under "${leadData.serviceCategory}".`,
                timestamp: now,
                isFlagged: false,
                userName: user?.fullName || 'SilverCorp Admin',
            }],
            emergencyContact: { name: '', email: '', phone: '', relation: '' },
            credentials: [],
            documents: [],
            tasks: [],
            detailedNotes: [],
            history: [{
                id: `hist-${Date.now() + i}`,
                type: 'general',
                user: user?.fullName || 'SilverCorp Admin',
                timestamp: now,
                description: 'Lead created via Excel import.'
            }],
            completedJourneySteps: []
        };

        try {
            const { id } = await api.createStudent(newStudentData);
            return { ...newStudentData, id };
        } catch (error) {
            console.error(`Failed to save imported lead ${studentIdStr}:`, error);
            return null;
        }
    });

    const results = await Promise.all(savePromises);
    const savedStudents = results.filter((s): s is Student => s !== null);

    setStudents(prevStudents => [...savedStudents, ...prevStudents]);
    handleCloseAddLeadModal();
  };

  const handleStudentClick = (student: Student) => {
    if (!openStudents.find(s => s.id === student.id) && openStudents.length >= 5) {
        setTabLimitNotification(`You can only open up to 5 student tabs. Please close an existing tab to open "${student.fullName}".`);
        setTimeout(() => setTabLimitNotification(null), 5000);
        return;
    }

    setSelectedStudent(student);
    setOpenStudents(prev => {
        if (prev.find(s => s.id === student.id)) return prev;
        return [...prev, student];
    });
    setCurrentView('detail');
  };

  const handleCloseStudentTab = (studentId: number) => {
    setOpenStudents(prev => {
        const newOpen = prev.filter(s => s.id !== studentId);
        if (selectedStudent?.id === studentId) {
            if (newOpen.length > 0) {
                setSelectedStudent(newOpen[newOpen.length - 1]);
                setCurrentView('detail');
            } else {
                setSelectedStudent(null);
                setCurrentView('leads');
            }
        }
        return newOpen;
    });
  };

  const handleSwitchToStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentView('detail');
  };

  const handleBackToLeads = () => {
    setCurrentView('leads');
  };

  const getExtendedDetailsChangeDescription = (oldDetails: StudentExtendedDetails = {}, newDetails: StudentExtendedDetails = {}): string => {
    const changes: string[] = [];
    
    // Helper to compare sections
    const compare = (fields: (keyof StudentExtendedDetails)[]) => {
      fields.forEach(field => {
        if (oldDetails[field] !== newDetails[field]) {
          const fieldName = String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          changes.push(`${fieldName} changed from '${oldDetails[field] || 'N/A'}' to '${newDetails[field] || 'N/A'}'`);
        }
      });
    };

    compare(['gender', 'dob', 'nationality', 'latestSchoolCollegeName', 'highestQualification', 'streamMajor', 'yearOfPassing', 'overallPercentageCGPA', 'anyOtherQualification', 'tenthPercentageCGPA', 'twelfthPercentageCGPA', 'englishTest', 'englishTestOverallScore', 'standardizedTests', 'standardizedTestScoreYear', 'otherTest', 'otherTestScoreYear', 'preferredIntake', 'preferredIntakeYear', 'preferredLevel', 'preferredCourseAreas', 'budget', 'specificUniversities', 'totalWorkExperience', 'currentLastJobTitle', 'employerNameLocation', 'briefJobRole', 'visaRefusals', 'visaRefusalDetails']);

    return `Extended Details | Extended Details Section | ${changes.length > 0 ? changes.join(', ') : 'No specific changes'}`;
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      let finalStudent = { ...updatedStudent, lastModifiedDate: new Date().toISOString() };
      
      const original = students.find(s => s.id === updatedStudent.id);
      if (original) {
        if (original.notes !== updatedStudent.notes) {
          finalStudent = addHistoryEntry(finalStudent, 'general', `Student Profile | Notes | Notes updated.`);
        }
        if (updatedStudent.detailedNotes.length > original.detailedNotes.length) {
          const newNote = updatedStudent.detailedNotes[0];
          finalStudent = addHistoryEntry(finalStudent, 'note', `Notes | Detailed Notes | New note added: "${newNote.text.substring(0, 50)}${newNote.text.length > 50 ? '...' : ''}"`);
        }
        // ... other checks already existed in the original code, but I'll call API update now
      }

      await api.updateStudent(updatedStudent.id, finalStudent);
      
      setStudents(currentStudents =>
        currentStudents.map(s => s.id === updatedStudent.id ? finalStudent : s)
      );
      
      if (selectedStudent?.id === updatedStudent.id) {
        setSelectedStudent(finalStudent);
      }
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  const handleLogin = async (email: string, pass: string, rememberMe: boolean): Promise<boolean> => {
    try {
      const result = await api.login(email, pass);
      if (result.success && result.user) {
        setUser(result.user);
        // Persist session by default as requested
        localStorage.setItem('silvercorp_session', JSON.stringify(result.user));
        setCurrentView('dashboard');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('silvercorp_session');
    setCurrentView('dashboard');
    setSelectedStudent(null);
  };

  const handleAddEmployee = async (employeeData: Omit<User, 'id' | 'avatarUrl'>) => {
    const newId = `EMP${Date.now()}`;
    const newEmployee: User = {
      ...employeeData,
      id: newId,
      avatarUrl: `https://picsum.photos/seed/${newId}/40/40`
    };
    try {
      await api.upsertEmployee(newEmployee);
      setEmployees(prev => [...prev, newEmployee]);
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  const handleEditEmployee = async (updatedEmployee: User) => {
    try {
      await api.upsertEmployee(updatedEmployee);
      setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
    } catch (error) {
      console.error('Failed to edit employee:', error);
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    try {
      await api.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Failed to remove employee:', error);
    }
  };

  const dashboardStudents = useMemo(() => {
    if (user?.role === 'admin') return students;
    return students.filter(s => s.assignedUserId === user?.id);
  }, [students, user]);

  const renderContent = () => {
    if (currentView === 'dashboard') {
        return <Dashboard 
            students={dashboardStudents} 
            userTasks={userTasks}
            user={user!}
            stats={dashboardStats}
            onNavigateToTasks={() => {
                setCurrentView('tasks');
            }} 
            onNavigateToLeads={() => {
                setCurrentView('leads');
            }}
        />;
    }
    
    if (currentView === 'tasks') {
        return <UserTasksTab 
            tasks={userTasks} 
            setTasks={setUserTasks} 
            deletedTasks={deletedTasks}
            setDeletedTasks={setDeletedTasks}
            employees={employees}
            students={students}
            setStudents={setStudents}
            currentUser={user}
        />;
    }
    
    if (currentView === 'detail' && selectedStudent) {
        return (
            <StudentPage 
                student={selectedStudent} 
                onBack={handleBackToLeads} 
                onUpdateStudent={handleUpdateStudent}
                onEditFollowUp={handleOpenEditFollowUpModal}
                onEditCountries={handleOpenEditCountriesModal}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                onUpdateServiceCategory={handleUpdateServiceCategory}
                setUserTasks={setUserTasks}
                employees={employees}
                currentUser={user}
            />
        );
    }

    if (currentView === 'admin') {
        return (
            <AdminTool 
                employees={employees}
                onAddEmployee={handleAddEmployee}
                onRemoveEmployee={handleRemoveEmployee}
                onEditEmployee={handleEditEmployee}
                students={students}
                userTasks={userTasks}
            />
        );
    }

    return (
        <div className="px-4 sm:px-6 py-2">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              
              selectedCountries={selectedCountries}
              onCountriesChange={setSelectedCountries}
              allCountries={allCountries}
              
              leadStatusFilter={leadStatusFilter}
              onLeadStatusChange={setLeadStatusFilter}
              allLeadStatuses={['New', 'In Follow-up', 'Converted', 'Lost', 'Finalised']}

              serviceCategoryFilter={serviceCategoryFilter}
              onServiceCategoryChange={setServiceCategoryFilter}
              allServiceCategories={['Document Editing', 'Abroad Education', 'Domestic Education', 'Visa Support', 'Test Prep', 'Profile Building', 'Education Loan', 'Other']}

              followUpFilter={followUpFilter}
              onFollowUpChange={setFollowUpFilter}
              assignedUserFilter={assignedUserFilter}
              onAssignedUserChange={setAssignedUserFilter}
              employees={employees}
              currentUserRole={user?.role}
            />
            <div className="flex justify-between items-center mt-2 px-0">
              <span className="text-sm text-slate-500 font-medium">
                Showing {sortedStudents.length} student{sortedStudents.length !== 1 ? 's' : ''}
              </span>
              {(searchQuery || selectedCountries.length > 0 || leadStatusFilter || serviceCategoryFilter || followUpFilter !== 'all' || assignedUserFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCountries([]);
                    setLeadStatusFilter('');
                    setServiceCategoryFilter('');
                    setFollowUpFilter('all');
                    setAssignedUserFilter('');
                  }}
                  className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              )}
            </div>
            <div className="mt-2 relative">
              {isLoadingStudents && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-3 text-slate-300">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Loading…
                  </div>
                </div>
              )}
              <StudentTable 
                students={sortedStudents} 
                onEditCountries={handleOpenEditCountriesModal}
                onEditFollowUp={handleOpenEditFollowUpModal}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                onUpdateServiceCategory={handleUpdateServiceCategory}
                onUpdateAssignedUser={handleUpdateAssignedUser}
                onViewChat={handleOpenChatModal}
                sortConfig={sortConfig}
                onSort={handleSort}
                onStudentClick={handleStudentClick}
                followUpFilter={followUpFilter}
                currentUser={user}
                employees={employees}
              />

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-800/50 rounded-b-lg">
                  <p className="text-sm text-slate-400">
                    Showing <span className="font-semibold text-white">{Math.min((currentPage - 1) * PAGE_SIZE + 1, totalStudents)}</span>–<span className="font-semibold text-white">{Math.min(currentPage * PAGE_SIZE, totalStudents)}</span> of <span className="font-semibold text-white">{totalStudents.toLocaleString()}</span> leads
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoadingStudents}
                      className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce<(number | string)[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === '…' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p as number)}
                            disabled={isLoadingStudents}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              p === currentPage
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            } disabled:opacity-40`}
                          >
                            {p}
                          </button>
                        )
                      )
                    }
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || isLoadingStudents}
                      className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
    );
  };

  const handleRefresh = async () => {
    // Refresh students by resetting page and incrementing refreshKey to force re-fetch
    setRefreshKey(prev => prev + 1);
    setCurrentPage(1);
  };

  if (!user) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header 
        onAddLeadClick={handleOpenAddLeadModal}
        onImportClick={handleOpenImportModal}
        onExportClick={handleOpenExportModal} 
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        onCloseStudentTab={handleCloseStudentTab}
        activeTab={currentView}
        onTabChange={setCurrentView}
        openStudents={openStudents}
        selectedStudentId={selectedStudent?.id}
        onSwitchToStudent={handleSwitchToStudent}
        user={user}
        onUpdateUser={(updatedUser) => {
          setUser(updatedUser);
          setAdminUser(updatedUser);
        }}
        logoUrl={logoUrl}
        onUpdateLogo={handleUpdateLogo}
      />
      <main className="w-full relative">
        {tabLimitNotification && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 border border-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">{tabLimitNotification}</span>
                    <button onClick={() => setTabLimitNotification(null)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
        {renderContent()}
      </main>

      {editingCountriesStudent && (
        <EditCountriesModal
          student={editingCountriesStudent}
          onSave={(newCountries) => handleSaveCountries(editingCountriesStudent.id, newCountries)}
          onClose={handleCloseEditCountriesModal}
          allCountries={allCountries}
        />
      )}

      {editingFollowUpStudent && (
        <EditFollowUpModal
            student={editingFollowUpStudent}
            onSave={(newDate, comment) => handleSaveFollowUp(editingFollowUpStudent.id, newDate, comment)}
            onClose={handleCloseEditFollowUpModal}
        />
      )}

      {viewingChatStudent && (
        <ChatHistoryModal
          student={viewingChatStudent}
          onClose={handleCloseChatModal}
          onAddMessage={(message) => handleAddChatMessage(viewingChatStudent.id, message)}
          onToggleFlagMessage={(messageId) => handleToggleFlagMessage(viewingChatStudent.id, messageId)}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
            onClose={handleCloseExportModal}
            onExport={handleExportData}
        />
      )}

      {showDailyAttendancePopup && user && (
        <AttendanceModal 
          user={user} 
          onClose={() => setShowDailyAttendancePopup(false)} 
          title="Discipline Beats Motivation"
          subtitle="Start your day with a check-in"
        />
      )}

      {isAddLeadModalOpen && (
        <AddLeadModal
            nextStudentId={nextStudentId}
            onClose={handleCloseAddLeadModal}
            onSave={handleSaveNewLead}
            onSaveBatch={handleSaveNewLeadsBatch}
            initialTab={addLeadModalInitialTab}
            currentUserRole={user?.role}
            employees={employees}
        />
      )}
    </div>
  );
};

export default App;