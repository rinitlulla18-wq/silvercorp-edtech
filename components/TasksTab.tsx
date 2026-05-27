import React, { useState } from 'react';
import { PlusIcon, SaveIcon, TrashIcon, CalendarIcon, EditIcon } from './icons';
import { Task, TaskStatus, User } from '../types';

interface TasksTabProps {
  tasks: Task[];
  onSaveTask: (task: Partial<Task>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  employees?: User[];
  currentUser?: User | null;
}

export const TasksTab: React.FC<TasksTabProps> = ({ tasks, onSaveTask, onUpdateTask, onDeleteTask, employees, currentUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    description: '',
    dueDate: new Date(),
    priority: 'Medium',
    assignedTo: currentUser?.id || 'Me',
    assignedBy: currentUser?.id || 'Me',
    status: TaskStatus.ToDo
  });

  const handleSave = () => {
    if (!newTask.description) return;
    
    if (editingTaskId) {
      onUpdateTask({ ...newTask, id: editingTaskId } as Task);
    } else {
      onSaveTask(newTask);
    }
    
    setIsAdding(false);
    setEditingTaskId(null);
    setNewTask({
      description: '',
      dueDate: new Date(),
      priority: 'Medium',
      assignedTo: currentUser?.id || 'Me',
      assignedBy: currentUser?.id || 'Me',
      status: TaskStatus.ToDo
    });
  };

  const handleClear = () => {
    setIsAdding(false);
    setEditingTaskId(null);
    setNewTask({
      description: '',
      dueDate: new Date(),
      priority: 'Medium',
      assignedTo: currentUser?.id || 'Me',
      assignedBy: currentUser?.id || 'Me',
      status: TaskStatus.ToDo
    });
  };

  const handleEdit = (task: Task) => {
    setNewTask({
      description: task.description,
      dueDate: new Date(task.dueDate),
      priority: task.priority,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      status: task.status
    });
    setEditingTaskId(task.id);
    setIsAdding(true);
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 pb-4 mb-6 gap-4">
        <h2 className="text-xl font-bold text-white">{editingTaskId ? 'Edit Task' : 'Tasks'}</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New task
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Description</label>
              <input
                type="text"
                autoFocus
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="What needs to be done?"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Assigned To</label>
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Assigned By</label>
              <select
                value={newTask.assignedBy}
                onChange={(e) => setNewTask({ ...newTask, assignedBy: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={handleClear}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
              <button
                onClick={handleSave}
                disabled={!newTask.description}
                className="flex items-center px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                {editingTaskId ? 'Update Task' : 'Save Task'}
              </button>
          </div>
        </div>
      )}

      {tasks.length > 0 || isAdding ? (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Description</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Due Date</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Priority</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Assigned To</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Assigned By</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="py-5 px-4 text-sm font-medium text-white">{task.description}</td>
                  <td className="py-5 px-4 text-sm text-slate-400 font-mono">
                    {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-5 px-4">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${
                      task.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      task.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      task.priority === 'Medium' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-sm text-slate-400">{employees?.find(e => e.id === task.assignedTo)?.fullName || task.assignedTo}</td>
                  <td className="py-5 px-4 text-sm text-slate-400">{employees?.find(e => e.id === task.assignedBy)?.fullName || task.assignedBy}</td>
                  <td className="py-5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(task)}
                        className="p-2 text-slate-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Task"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};