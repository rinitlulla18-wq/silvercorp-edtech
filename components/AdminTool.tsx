import React, { useState, useMemo } from 'react';
import { User, Student, UserTask, TaskStatus } from '../types';
import { Trash2, UserPlus, Shield, User as UserIcon, Phone, Mail, Building2, Briefcase, Key, Edit2, X, TrendingUp, CheckCircle, Target } from 'lucide-react';

interface AdminToolProps {
  employees: User[];
  onAddEmployee: (employee: Omit<User, 'id' | 'avatarUrl'>) => void;
  onRemoveEmployee: (id: string) => void;
  onEditEmployee: (employee: User) => void;
  students: Student[];
  userTasks: UserTask[];
}

export const AdminTool: React.FC<AdminToolProps> = ({ employees, onAddEmployee, onRemoveEmployee, onEditEmployee, students, userTasks }) => {
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '+91 ',
    role: 'employee' as 'admin' | 'employee' | 'channel_partner',
    roleCategory: 'Counsellor',
    organisationName: 'SilverCorp EdTech'
  });

  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployee.fullName && newEmployee.email && newEmployee.password) {
      onAddEmployee({
        ...newEmployee,
        homeAddress: '',
        emergencyContact: '',
      });
      setNewEmployee({
        fullName: '',
        email: '',
        password: '',
        mobile: '+91 ',
        role: 'employee',
        roleCategory: 'Counsellor',
        organisationName: 'SilverCorp EdTech'
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      onEditEmployee(editingEmployee);
      setEditingEmployee(null);
    }
  };

  const employeePerformance = useMemo(() => {
    return employees.map(emp => {
      const assignedStudents = students.filter(s => s.assignedUserId === emp.id);
      const finalisedStudents = assignedStudents.filter(s => s.leadStatus === 'Finalised');
      const inFollowUpStudents = assignedStudents.filter(s => s.leadStatus === 'In Follow-up');
      const convertedStudents = assignedStudents.filter(s => s.leadStatus === 'Converted');
      
      const conversionRate = assignedStudents.length > 0 ? Math.round((convertedStudents.length / assignedStudents.length) * 100) : 0;
      const finalisedRate = assignedStudents.length > 0 ? Math.round((finalisedStudents.length / assignedStudents.length) * 100) : 0;
      const inFollowUpRate = assignedStudents.length > 0 ? Math.round((inFollowUpStudents.length / assignedStudents.length) * 100) : 0;

      // Loan Applied count (Step 112)
      const loansApplied = assignedStudents.filter(s => 
        s.journeyRecords?.some(r => r.stepId === 112 && r.type === 'loan')
      ).length;

      // Loan Disbursed count from journey records
      const loansDisbursed = assignedStudents.filter(s => 
        s.journeyRecords?.some(r => r.stepId === 105 && r.type === 'loan')
      ).length;
      const loanDisbursedRate = loansApplied > 0 ? Math.round((loansDisbursed / loansApplied) * 100) : 0;

      // Tasks from students
      const assignedTasks = students.flatMap(s => s.tasks || []).filter(t => t.assignedTo === emp.id);
      const completedTasks = assignedTasks.filter(t => t.status === TaskStatus.Done);
      
      // Tasks from global userTasks
      const assignedUserTasks = userTasks.filter(t => t.collaboratorId === emp.id);
      const completedUserTasks = assignedUserTasks.filter(t => t.completed);

      const totalTasks = assignedTasks.length + assignedUserTasks.length;
      const totalCompletedTasks = completedTasks.length + completedUserTasks.length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

      // Rating calculation (out of 10)
      // 40% Conversion, 10% Task Completion, 40% Finalised, 10% Loan Disbursed
      const rating = (
        (conversionRate * 0.4) + 
        (taskCompletionRate * 0.1) + 
        (finalisedRate * 0.4) + 
        (loanDisbursedRate * 0.1)
      ) / 10;

      return {
        ...emp,
        leadsAssigned: assignedStudents.length,
        leadsConverted: convertedStudents.length,
        leadsFinalised: finalisedStudents.length,
        leadsInFollowUp: inFollowUpStudents.length,
        loansApplied,
        loansDisbursed,
        conversionRate,
        finalisedRate,
        inFollowUpRate,
        loanDisbursedRate,
        tasksAssigned: totalTasks,
        tasksCompleted: totalCompletedTasks,
        taskCompletionRate,
        rating: Number(rating.toFixed(1))
      };
    });
  }, [employees, students, userTasks]);

  return (
    <div className="px-4 sm:px-6 py-2 bg-slate-900 min-h-screen text-slate-200">
      <div className="w-full space-y-4">
        {/* Performance Overview */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Employee Performance Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center leading-tight">Leads<br/>Assigned</th>
                  <th className="px-4 py-3 text-center leading-tight">Finalised</th>
                  <th className="px-4 py-3 text-center leading-tight">In Follow-up</th>
                  <th className="px-4 py-3 text-center leading-tight">Loan<br/>Disbursed</th>
                  <th className="px-4 py-3 text-center leading-tight">Converted</th>
                  <th className="px-4 py-3 text-center leading-tight">Task<br/>Completion</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">Rating</th>
                </tr>
              </thead>
              <tbody>
                {employeePerformance.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                        {emp.fullName.charAt(0)}
                      </div>
                      {emp.fullName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                          emp.role === 'admin' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 
                          emp.role === 'channel_partner' ? 'bg-amber-900/50 text-amber-400 border border-amber-800' :
                          'bg-blue-900/50 text-blue-400 border border-blue-800'
                        }`}>
                          {emp.role === 'channel_partner' ? 'Partner' : (emp.role || 'Staff')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{emp.roleCategory}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{emp.leadsAssigned}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-purple-400 font-semibold">{emp.leadsFinalised}</span>
                        <span className="text-[10px] text-slate-500">{emp.finalisedRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-amber-400 font-semibold">{emp.leadsInFollowUp}</span>
                        <span className="text-[10px] text-slate-500">{emp.inFollowUpRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-semibold">{emp.loansDisbursed}</span>
                        <span className="text-[10px] text-slate-500">{emp.loanDisbursedRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-semibold">{emp.leadsConverted}</span>
                        <span className="text-[10px] text-slate-500">{emp.conversionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={emp.taskCompletionRate >= 50 ? 'text-blue-400' : emp.taskCompletionRate > 0 ? 'text-yellow-400' : 'text-slate-500'}>
                          {emp.taskCompletionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-black ${
                          emp.rating >= 8 ? 'text-emerald-400' : 
                          emp.rating >= 5 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {emp.rating}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase font-bold">/ 10</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {employeePerformance.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Employee Form */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Add New Employee
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
              <input
                type="text"
                value={newEmployee.fullName}
                onChange={e => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
              <input
                type="email"
                value={newEmployee.email}
                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={newEmployee.password}
                onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Mobile Number</label>
              <input
                type="tel"
                value={newEmployee.mobile}
                onChange={e => setNewEmployee({ ...newEmployee, mobile: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
              <select
                value={newEmployee.role}
                onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="channel_partner">Channel Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Role Category</label>
              <select
                value={newEmployee.roleCategory}
                onChange={e => setNewEmployee({ ...newEmployee, roleCategory: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="Counsellor">Counsellor</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Editor">Editor</option>
                <option value="Education Loan">Education Loan</option>
                <option value="VISA">VISA</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Payment Transfer">Payment Transfer</option>
                <option value="Insurance">Insurance</option>
                <option value="Quality Matrix">Quality Matrix</option>
                <option value="Test Preparation">Test Preparation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Organisation Name</label>
              <input
                type="text"
                value={newEmployee.organisationName}
                onChange={e => setNewEmployee({ ...newEmployee, organisationName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="SilverCorp EdTech"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-2.5 rounded-lg transition shadow-lg shadow-blue-900/20"
              >
                Create User
              </button>
            </div>
            </div>
          </form>
        </div>

        {/* Employee List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-400" />
              Existing Employees
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Role & Org</th>
                  <th className="px-6 py-4 font-semibold">Password</th>
                  <th className="px-6 py-4 font-semibold text-center">Edit</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-xs">
                          {emp.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-200">{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Mail className="w-4 h-4" />
                          {emp.email}
                        </div>
                        {emp.mobile && (
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Phone className="w-4 h-4" />
                            {emp.mobile}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            emp.role === 'admin' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' : 
                            emp.role === 'channel_partner' ? 'bg-amber-900/50 text-amber-400 border border-amber-800' :
                            'bg-blue-900/50 text-blue-400 border border-blue-800'
                          }`}>
                            {emp.role === 'channel_partner' ? 'Channel Partner' : (emp.role || 'employee')}
                          </span>
                          {emp.roleCategory && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                              <Briefcase className="w-3 h-3" />
                              {emp.roleCategory}
                            </span>
                          )}
                        </div>
                        {emp.organisationName && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Building2 className="w-3 h-3" />
                            {emp.organisationName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 text-slate-300 text-sm font-mono bg-slate-900 px-3 py-1.5 rounded-md border border-slate-700">
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        {emp.password || '••••••••'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onRemoveEmployee(emp.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Edit Employee
              </h2>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingEmployee.fullName}
                    onChange={e => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={editingEmployee.email}
                    onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                  <input
                    type="text"
                    value={editingEmployee.password || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    value={editingEmployee.mobile}
                    onChange={e => setEditingEmployee({ ...editingEmployee, mobile: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                  <select
                    value={editingEmployee.role}
                    onChange={e => setEditingEmployee({ ...editingEmployee, role: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                    <option value="channel_partner">Channel Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Role Category</label>
                  <select
                    value={editingEmployee.roleCategory || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, roleCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="Counsellor">Counsellor</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Editor">Editor</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="VISA">VISA</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Payment Transfer">Payment Transfer</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Quality Matrix">Quality Matrix</option>
                    <option value="Test Preparation">Test Preparation</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Organisation Name</label>
                  <input
                    type="text"
                    value={editingEmployee.organisationName || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, organisationName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-6 py-2.5 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-2.5 rounded-lg transition shadow-lg shadow-blue-900/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
