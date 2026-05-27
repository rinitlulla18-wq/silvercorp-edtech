import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Clock,
  CheckSquare,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { UserTask, User, Student, TaskStatus } from '../types';

interface UserTasksTabProps {
  tasks: UserTask[];
  setTasks: React.Dispatch<React.SetStateAction<UserTask[]>>;
  deletedTasks: UserTask[];
  setDeletedTasks: React.Dispatch<React.SetStateAction<UserTask[]>>;
  employees?: User[];
  students?: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  currentUser?: User | null;
}

export const UserTasksTab: React.FC<UserTasksTabProps> = ({ tasks, setTasks, deletedTasks, setDeletedTasks, employees = [], students = [], setStudents, currentUser }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<UserTask['priority']>('Medium');
  const [newTaskStudentId, setNewTaskStudentId] = useState('');
  const [newTaskCollaboratorId, setNewTaskCollaboratorId] = useState('');
  const [studentIdError, setStudentIdError] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'completed' | 'deleted'>('all');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    setStudentIdError('');
    let targetStudent: Student | undefined;

    if (newTaskStudentId.trim()) {
      targetStudent = students.find(s => s.studentId === newTaskStudentId.trim());
      if (!targetStudent) {
        setStudentIdError('Student ID not found in leads.');
        return;
      }
    }
    
    const newTask: UserTask = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      date: new Date().toISOString().split('T')[0],
      priority: newTaskPriority,
      studentId: targetStudent?.studentId,
      collaboratorId: newTaskCollaboratorId || undefined
    };
    
    setTasks([newTask, ...tasks]);

    // Update student's tasks and collaborators if applicable
    if (targetStudent && setStudents) {
      const updatedStudent = { ...targetStudent };
      
      // Add to student's tasks
      const newStudentTask = {
        id: newTask.id,
        description: newTask.text,
        dueDate: new Date(),
        status: TaskStatus.ToDo,
        assignedTo: newTaskCollaboratorId || currentUser?.id || 'Unassigned',
        assignedBy: currentUser?.id || 'System',
        priority: newTask.priority
      };
      updatedStudent.tasks = [newStudentTask, ...(updatedStudent.tasks || [])];

      // Add to student's collaborators if a collaborator is selected
      if (newTaskCollaboratorId) {
        const existingCollaborators = updatedStudent.collaborators || [];
        if (!existingCollaborators.find(c => c.userId === newTaskCollaboratorId)) {
          updatedStudent.collaborators = [
            ...existingCollaborators,
            { userId: newTaskCollaboratorId, status: 'Not Started Yet' }
          ];
        }
      }

      updatedStudent.lastModifiedDate = new Date().toISOString();
      setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    }

    setNewTaskText('');
    setNewTaskPriority('Medium');
    setNewTaskStudentId('');
    setNewTaskCollaboratorId('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      setDeletedTasks([taskToDelete, ...deletedTasks]);
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const restoreTask = (id: string) => {
    const taskToRestore = deletedTasks.find(t => t.id === id);
    if (taskToRestore) {
      setTasks([taskToRestore, ...tasks]);
      setDeletedTasks(deletedTasks.filter(t => t.id !== id));
    }
  };

  const permanentlyDeleteTask = (id: string) => {
    setDeletedTasks(deletedTasks.filter(t => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    const dateTasks = tasks.filter(t => t.date === filterDate);
    if (viewMode === 'pending') return dateTasks.filter(t => !t.completed);
    if (viewMode === 'completed') return dateTasks.filter(t => t.completed);
    return dateTasks;
  }, [tasks, filterDate, viewMode]);

  const filteredDeletedTasks = useMemo(() => {
    return deletedTasks.filter(t => t.date === filterDate);
  }, [deletedTasks, filterDate]);

  const unfinishedTasks = useMemo(() => {
    return tasks.filter(t => !t.completed);
  }, [tasks]);

  // Analytics Data
  const monthlyData = [
    { name: 'Week 1', completed: 22, total: 30 },
    { name: 'Week 2', completed: 18, total: 25 },
    { name: 'Week 3', completed: 25, total: 28 },
    { name: 'Week 4', completed: 15, total: 20 },
  ];

  const completionRate = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / total) * 100);
  }, [tasks]);

  const getPriorityColor = (priority: UserTask['priority']) => {
    switch (priority) {
      case 'Urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Low': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="p-6 bg-slate-800 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">My Daily Tasks</h2>
            <p className="text-slate-400">Manage your daily workflow and track your progress</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-3 flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Completion</p>
              <p className="text-2xl font-bold text-emerald-500">{completionRate}%</p>
            </div>
            <div className="h-10 w-10 rounded-full border-4 border-slate-700 border-t-emerald-500 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* To-Do List Section */}
          <div className="space-y-6">
            <div className={`bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all ${viewMode === 'deleted' ? 'ring-2 ring-red-500/50' : viewMode === 'pending' ? 'ring-2 ring-blue-500/50' : viewMode === 'completed' ? 'ring-2 ring-emerald-500/50' : ''}`}>
              <div className="p-6 border-b border-slate-700 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {viewMode === 'deleted' ? (
                      <>
                        <Trash2 className="h-4 w-4 text-red-500" />
                        Deleted Tasks for {filterDate === new Date().toISOString().split('T')[0] ? 'Today' : filterDate}
                      </>
                    ) : viewMode === 'completed' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Completed Tasks for {filterDate === new Date().toISOString().split('T')[0] ? 'Today' : filterDate}
                      </>
                    ) : viewMode === 'pending' ? (
                      <>
                        <Clock className="h-4 w-4 text-blue-500" />
                        Pending Tasks for {filterDate === new Date().toISOString().split('T')[0] ? 'Today' : filterDate}
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Tasks for {filterDate === new Date().toISOString().split('T')[0] ? 'Today' : filterDate}
                      </>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {viewMode !== 'all' && (
                      <button 
                        onClick={() => setViewMode('all')}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Back to all tasks"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    )}
                    <div className="relative">
                      <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer transition-all duration-200 hover:border-slate-500 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
                {viewMode !== 'deleted' && filterDate >= new Date().toISOString().split('T')[0] && (
                  <form onSubmit={addTask} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Add a new task..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskStudentId}
                        onChange={(e) => {
                            setNewTaskStudentId(e.target.value);
                            setStudentIdError('');
                        }}
                        placeholder="Student ID (Optional)"
                        className={`flex-1 bg-slate-800 border ${studentIdError ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <select
                        value={newTaskCollaboratorId}
                        onChange={(e) => setNewTaskCollaboratorId(e.target.value)}
                        className={`flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${!newTaskCollaboratorId ? 'text-slate-500' : 'text-white'}`}
                      >
                        <option value="" className="text-slate-500">Collaborate User (Optional)</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id} className="text-white">{emp.fullName}</option>
                        ))}
                      </select>
                    </div>
                    {studentIdError && (
                        <p className="text-red-500 text-xs mt-1">{studentIdError}</p>
                    )}
                    <div className="flex gap-2">
                      <select 
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {(viewMode === 'deleted' ? filteredDeletedTasks : filteredTasks).length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                      {viewMode === 'deleted' ? (
                        <Trash2 className="h-8 w-8 text-slate-600" />
                      ) : viewMode === 'completed' ? (
                        <CheckCircle2 className="h-8 w-8 text-slate-600" />
                      ) : (
                        <Clock className="h-8 w-8 text-slate-600" />
                      )}
                    </div>
                    <p className="text-slate-400">
                      {viewMode === 'deleted' ? 'No deleted tasks for this date.' : 
                       viewMode === 'completed' ? 'No completed tasks for this date.' :
                       viewMode === 'pending' ? 'No pending tasks for this date.' :
                       'No tasks for this date.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {(viewMode === 'deleted' ? filteredDeletedTasks : filteredTasks).map(task => (
                      <div 
                        key={task.id}
                        className={`group flex items-center justify-between p-4 rounded-xl transition-all ${
                          task.completed ? 'bg-slate-800/30 opacity-60' : 'hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          {viewMode !== 'deleted' && (
                            <button 
                              onClick={() => toggleTask(task.id)}
                              className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-500 hover:text-blue-400'}`}
                            >
                              {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </button>
                          )}
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.text}
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.studentId && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 bg-slate-700/50 text-slate-300">
                                        Student: {task.studentId}
                                    </span>
                                )}
                                {task.collaboratorId && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-600/30 bg-blue-900/20 text-blue-400">
                                        Collab: {employees.find(e => e.id === task.collaboratorId)?.fullName || task.collaboratorId}
                                    </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {viewMode === 'deleted' ? (
                            <>
                              <button 
                                onClick={() => restoreTask(task.id)}
                                className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                                title="Restore task"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => permanentlyDeleteTask(task.id)}
                                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                title="Permanently delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setViewMode(viewMode === 'pending' ? 'all' : 'pending')}
                className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition-all hover:border-blue-500/50 ${viewMode === 'pending' ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700'}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                </div>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.date === filterDate && !t.completed).length}</p>
              </div>
              <div 
                onClick={() => setViewMode(viewMode === 'completed' ? 'all' : 'completed')}
                className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition-all hover:border-emerald-500/50 ${viewMode === 'completed' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700'}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                </div>
                <p className="text-2xl font-bold text-white">{tasks.filter(t => t.date === filterDate && t.completed).length}</p>
              </div>
            </div>

            {/* Deleted Section */}
            <div 
              onClick={() => setViewMode(viewMode === 'deleted' ? 'all' : 'deleted')}
              className={`bg-slate-900 border rounded-2xl p-5 cursor-pointer transition-all hover:border-red-500/50 ${viewMode === 'deleted' ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700'}`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deleted</span>
              </div>
              <p className="text-2xl font-bold text-white">{filteredDeletedTasks.length}</p>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="space-y-8">
            {/* Monthly Progress */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-600 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Monthly Overview</h3>
                    <p className="text-sm text-slate-400">Total vs Completed tasks per week</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                   <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
                      <span className="text-xs text-slate-400 font-medium">Total</span>
                   </div>
                   <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-slate-400 font-medium">Completed</span>
                   </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                      itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: '600' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar dataKey="total" fill="#475569" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Unfinished Tasks Section */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-600 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Unfinished Tasks</h3>
                    <p className="text-sm text-slate-400">Tasks requiring your attention</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{unfinishedTasks.length}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Pending</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unfinishedTasks.length === 0 ? (
                  <div className="col-span-2 py-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                    <p className="text-slate-500">No unfinished tasks. Great job!</p>
                  </div>
                ) : (
                  unfinishedTasks.slice(0, 6).map(task => (
                    <div key={task.id} className="group bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-800/60 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-white transition-colors">{task.text}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold whitespace-nowrap ml-2 shadow-sm ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500 mt-3 font-mono tracking-tight">
                        <Calendar className="h-3 w-3 mr-1.5 opacity-70" />
                        {new Date(task.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {unfinishedTasks.length > 6 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-500">And {unfinishedTasks.length - 6} more unfinished tasks...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
