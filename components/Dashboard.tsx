import React, { useMemo } from 'react';
import { Student, LeadStatus, UserTask, User } from '../types';
import { countryMap } from '../data/countries';

interface DashboardProps {
  students: Student[];
  userTasks: UserTask[];
  user: User;
  onNavigateToTasks: () => void;
  onNavigateToLeads: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string; subtext?: string }> = ({ title, value, icon, colorClass, subtext }) => (
  <div className="bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-700 flex items-start space-x-4">
    <div className={`p-3 rounded-lg ${colorClass} text-white`}>
      {icon}
    </div>
    <div>
      <h2 className="text-sm font-medium text-slate-400">{title}</h2>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  </div>
);

const ProgressBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="text-slate-400">{count} ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// Icons
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

export const Dashboard: React.FC<DashboardProps> = ({ students, userTasks, user, stats, onNavigateToTasks, onNavigateToLeads }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const derivedStats = useMemo(() => {
    if (!stats) return null;

    // We still calculate some things locally or show global stats from the server
    const total = stats.total;
    const overdue = stats.overdue;
    const dueToday = stats.dueToday;
    const converted = stats.converted;
    const finalised = stats.finalised;

    // Conversion Rate
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const finalisedRate = total > 0 ? Math.round((finalised / total) * 100) : 0;

    // Performance Rating (Complex logic still done locally for now or we could move)
    // For now, let's use the actual counts from the stats object for the cards
    return {
      total,
      overdue,
      dueToday,
      converted,
      finalised,
      conversionRate,
      finalisedRate,
      rating: 8.5 // Placeholder for now or calculate from some server metric
    };
  }, [stats]);

  const recentNotifications = useMemo(() => {
    // Simulate notifications from last modified students
    return [...students]
      .sort((a, b) => new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime())
      .slice(0, 5)
      .map(s => {
        const isNew = new Date(s.createdDate).getTime() === new Date(s.lastModifiedDate).getTime();
        return {
          id: s.id,
          title: isNew ? 'New Lead Created' : 'Lead Updated',
          description: `${s.fullName} (${s.leadStatus})`,
          time: new Date(s.lastModifiedDate).toLocaleDateString(),
          type: isNew ? 'new' : 'update'
        };
      });
  }, [students]);

  const tasks = useMemo(() => {
    return userTasks
      .filter(t => !t.completed && (t.priority === 'Urgent' || t.priority === 'High'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [userTasks]);

  const topServices = useMemo(() => {
    return (stats?.serviceDistribution || [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats?.serviceDistribution]);

  const topCountries = useMemo(() => {
    return (stats?.countryDistribution || [])
      .map(c => ({ ...c, label: countryMap[c.label] || c.label }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats?.countryDistribution]);

  const statusMap = useMemo(() => {
    const map: Record<string, number> = {};
    (stats?.statusDistribution || []).forEach(s => {
      map[s.label] = s.count;
    });
    return map;
  }, [stats?.statusDistribution]);

  if (!stats || !derivedStats) return <div className="p-10 text-center text-slate-500">Loading statistics...</div>;

  return (
    <div className="px-4 sm:px-6 py-2 space-y-4 w-full">
      {/* Key Metrics Row */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-white">Performance Overview</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          title="Total Leads" 
          value={derivedStats.total} 
          icon={<UsersIcon />} 
          colorClass="bg-blue-500" 
          subtext="Assigned to you"
        />
        <StatCard 
          title="Finalised" 
          value={derivedStats.finalised} 
          icon={<CheckBadgeIcon />} 
          colorClass="bg-purple-500" 
          subtext={`${derivedStats.finalisedRate}% success rate`}
        />
        <StatCard 
          title="In Follow-up" 
          value={statusMap['In Follow-up'] || 0} 
          icon={<ClockIcon />} 
          colorClass="bg-amber-500" 
          subtext={`${Math.round(((statusMap['In Follow-up'] || 0) / derivedStats.total) * 100)}% of total`}
        />
        <StatCard 
          title="Converted" 
          value={derivedStats.converted} 
          icon={<TrendingUpIcon />} 
          colorClass="bg-indigo-500" 
          subtext={`${derivedStats.conversionRate}% efficiency`}
        />
        <StatCard 
          title="Lost" 
          value={statusMap['Lost'] || 0} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
          colorClass="bg-slate-500" 
          subtext={`${Math.round(((statusMap['Lost'] || 0) / derivedStats.total) * 100)}% of total`}
        />
        <StatCard 
          title="Due Today" 
          value={derivedStats.dueToday} 
          icon={<CalendarIcon />} 
          colorClass="bg-blue-500" 
          subtext="Follow-ups required"
        />
        <StatCard 
          title="Overdue" 
          value={derivedStats.overdue} 
          icon={<ClockIcon />} 
          colorClass="bg-red-500" 
          subtext="Action needed"
        />
        <div className="bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-700 flex items-start space-x-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full flex items-center justify-center">
             <span className="text-[10px] font-black text-blue-400 rotate-45 translate-x-2 -translate-y-2">RATING</span>
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Performance Rating</p>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-3xl font-black text-white">{derivedStats.rating}</h3>
              <span className="text-xs text-slate-500 font-bold">/ 10</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Based on all parameters</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Status Distribution */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Lead Status</h3>
            <button onClick={onNavigateToLeads} className="text-sm text-blue-400 hover:text-blue-300 font-medium">
              {user.role === 'admin' ? 'View All Leads' : 'View My Leads'}
            </button>
          </div>
          <div className="p-6 space-y-4">
            <ProgressBar label="New" count={statusMap['New'] || 0} total={derivedStats.total} color="bg-blue-500" />
            <ProgressBar label="In Follow-up" count={statusMap['In Follow-up'] || 0} total={derivedStats.total} color="bg-yellow-400" />
            <ProgressBar label="Converted" count={statusMap['Converted'] || 0} total={derivedStats.total} color="bg-green-500" />
            <ProgressBar label="Finalised" count={statusMap['Finalised'] || 0} total={derivedStats.total} color="bg-purple-500" />
            <ProgressBar label="Lost" count={statusMap['Lost'] || 0} total={derivedStats.total} color="bg-slate-400" />
          </div>
        </div>

        {/* Service Categories */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Services</h3>
          <div className="space-y-3">
            {topServices.map((service, index) => (
              <div key={service.label} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-300">{service.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-400">{service.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Countries */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Destinations</h3>
          <div className="space-y-3">
             {topCountries.map((country, index) => (
              <div key={country.label} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-900/50 text-xs font-bold text-indigo-300">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-300">{country.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-800 rounded-full h-1.5">
                         <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (country.count / derivedStats.total) * 100 * 5)}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-400">{country.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Notifications & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         {/* Tasks */}
         <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ClipboardListIcon />
                    Priority Tasks
                </h3>
                <button onClick={onNavigateToTasks} className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All Tasks</button>
            </div>
            <div className="p-6">
                {tasks.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No urgent tasks today!</p>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => {
                            const isOverdue = new Date(task.date).getTime() < today.getTime();
                            const priorityColor = task.priority === 'Urgent' ? 'bg-red-500' : 'bg-orange-500';
                            return (
                                <div key={task.id} className="flex items-start space-x-3 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                                    <div className={`mt-1 w-2 h-2 rounded-full ${priorityColor}`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200">
                                            {task.text}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                            <span>{isOverdue ? 'Overdue since ' : 'Due: '} {new Date(task.date).toLocaleDateString()}</span>
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                task.priority === 'Urgent' ? 'bg-red-900/50 text-red-400' : 'bg-orange-900/50 text-orange-400'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
         </div>

         {/* Notifications */}
         <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 flex flex-col">
            <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BellIcon />
                    Recent Activity
                </h3>
            </div>
            <div className="p-6">
                 <div className="space-y-4">
                    {recentNotifications.map((notif, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${notif.type === 'new' ? 'bg-blue-900/50 text-blue-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                <BellIcon />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-200">{notif.title}</p>
                                <p className="text-xs text-slate-500">{notif.description}</p>
                            </div>
                            <span className="text-xs text-slate-500">{notif.time}</span>
                        </div>
                    ))}
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};