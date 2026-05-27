import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, LogIn, LogOut, Palmtree } from 'lucide-react';
import { api } from '../src/api';

const STORAGE_PREFIX = 'silvercorp_attendance_v1_';
const WORK_LABEL = '10:30 AM – 7:00 PM';
const ANNUAL_PAID_LEAVES = 18;

export type LeaveType = 'full' | 'half_am' | 'half_pm';

export interface DayAttendance {
  date: string;
  loginTime?: string;
  logoutTime?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
    capturedAt: string;
  };
  checkInLocation?: {
    lat: number;
    lng: number;
    address: string;
    capturedAt: string;
  };
  checkOutLocation?: {
    lat: number;
    lng: number;
    address: string;
    capturedAt: string;
  };
}

export interface LeaveRecord {
  id: string;
  date: string;
  type: LeaveType;
  submittedAt: string;
}

interface Stored {
  days: Record<string, DayAttendance>;
  leaves: LeaveRecord[];
}



function leaveWeight(type: LeaveType): number {
  return type === 'full' ? 1 : 0.5;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SilverCorpEdtech/1.0 (attendance; contact: admin@silvercorp.com)',
    },
  });
  if (!res.ok) throw new Error('Geocode failed');
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

interface AttendanceLeavesSectionProps {
  userId: string;
  mode?: 'attendance' | 'leave' | 'both';
}

export const AttendanceLeavesSection: React.FC<AttendanceLeavesSectionProps> = ({ userId, mode = 'both' }) => {
  const [stored, setStored] = useState<Stored>({ days: {}, leaves: [] });
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const todayStr = ymd(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr);
  const [leaveDate, setLeaveDate] = useState(() => todayStr);
  const [leaveType, setLeaveType] = useState<LeaveType>('full');
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [clockStatus, setClockStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.fetchAttendance(userId);
        setStored(data);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      }
    };
    load();
  }, [userId]);

  const persist = useCallback(async (next: Stored, type: 'attendance' | 'leave', item: any) => {
    setStored(next);
    try {
      if (type === 'attendance') {
        await api.updateAttendance(userId, item);
      } else {
        await api.addLeave(userId, item);
      }
    } catch (error) {
      console.error('Failed to persist attendance/leave:', error);
    }
  }, [userId]);

  const year = new Date().getFullYear();

  const leavesUsedThisYear = useMemo(() => {
    return stored.leaves.reduce((sum, L) => {
      const y = new Date(L.date + 'T12:00:00').getFullYear();
      if (y !== year) return sum;
      return sum + leaveWeight(L.type);
    }, 0);
  }, [stored.leaves, year]);

  const leavesUsedThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return stored.leaves.reduce((sum, L) => {
      const d = new Date(L.date + 'T12:00:00');
      if (d.getFullYear() === year && d.getMonth() === currentMonth) {
        return sum + leaveWeight(L.type);
      }
      return sum;
    }, 0);
  }, [stored.leaves, year]);

  const leavesRemaining = Math.max(0, ANNUAL_PAID_LEAVES - leavesUsedThisYear);

  const avgWorkingHours = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const days = Object.values(stored.days) as DayAttendance[];
    const daysWithTimes = days.filter(d => {
      if (!d.loginTime || !d.logoutTime) return false;
      const date = new Date(d.date + 'T12:00:00');
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    if (daysWithTimes.length === 0) return 0;
    
    const totalMs = daysWithTimes.reduce((sum: number, d) => {
      const login = new Date(d.loginTime!).getTime();
      const logout = new Date(d.logoutTime!).getTime();
      return sum + (logout - login);
    }, 0);
    
    return totalMs / daysWithTimes.length / (1000 * 60 * 60);
  }, [stored.days]);

  const monthStart = useMemo(
    () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1),
    [calendarMonth]
  );
  const monthEnd = useMemo(
    () => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0),
    [calendarMonth]
  );

  const presentDaysThisMonth = useMemo(() => {
    let n = 0;
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const key = ymd(d);
      if (stored.days[key]?.loginTime) n += 1;
    }
    return n;
  }, [stored.days, monthStart, monthEnd]);

  const todayRecord = stored.days[todayStr];
  const hasLeaveOn = useCallback(
    (dateStr: string) => stored.leaves.some((l) => l.date === dateStr),
    [stored.leaves]
  );

  const getLeaveOnDay = useCallback(
    (dateStr: string) => stored.leaves.find((l) => l.date === dateStr),
    [stored.leaves]
  );

  const handleCheckIn = () => {
    setClockStatus(null);
    if (todayRecord?.loginTime) {
      setClockStatus('Already checked in today.');
      return;
    }

    const performCheckIn = (loc?: DayAttendance['checkInLocation']) => {
      const dayData = {
        date: todayStr,
        loginTime: new Date().toISOString(),
        checkInLocation: loc,
        location: loc,
      };
      const next: Stored = {
        ...stored,
        days: {
          ...stored.days,
          [todayStr]: dayData,
        },
      };
      persist(next, 'attendance', dayData);
      setClockStatus(loc ? 'Checked in with location.' : 'Checked in.');
    };

    // Try to get location automatically
    if (navigator.geolocation) {
      setGeoStatus('Capturing check-in location...');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          try {
            address = await reverseGeocode(lat, lng);
          } catch { /* ignore */ }
          const loc = {
            lat,
            lng,
            address,
            capturedAt: new Date().toISOString(),
          };
          performCheckIn(loc);
          setGeoStatus(null);
        },
        () => {
          setGeoStatus('Location failed, checking in without it.');
          performCheckIn();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      performCheckIn();
    }
  };

  const handleCheckOut = () => {
    setClockStatus(null);
    if (!todayRecord?.loginTime) {
      setClockStatus('Check in first.');
      return;
    }
    if (todayRecord.logoutTime) {
      setClockStatus('Already checked out today.');
      return;
    }

    const performCheckOut = (loc?: DayAttendance['checkOutLocation']) => {
      const dayData = {
        ...todayRecord,
        date: todayStr,
        logoutTime: new Date().toISOString(),
        checkOutLocation: loc,
      };
      const next: Stored = {
        ...stored,
        days: {
          ...stored.days,
          [todayStr]: dayData,
        },
      };
      persist(next, 'attendance', dayData);
      setClockStatus(loc ? 'Checked out with location.' : 'Checked out.');
    };

    // Try to get location automatically
    if (navigator.geolocation) {
      setGeoStatus('Capturing check-out location...');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          try {
            address = await reverseGeocode(lat, lng);
          } catch { /* ignore */ }
          const loc = {
            lat,
            lng,
            address,
            capturedAt: new Date().toISOString(),
          };
          performCheckOut(loc);
          setGeoStatus(null);
        },
        () => {
          setGeoStatus('Location failed, checking out without it.');
          performCheckOut();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      performCheckOut();
    }
  };

  const handleApplyLeave = () => {
    if (hasLeaveOn(leaveDate)) {
      alert('You already have leave on this date.');
      return;
    }
    const w = leaveWeight(leaveType);
    if (w > leavesRemaining + 1e-6) {
      alert(`Not enough balance. Remaining: ${leavesRemaining} day(s).`);
      return;
    }
    const rec: LeaveRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: leaveDate,
      type: leaveType,
      submittedAt: new Date().toISOString(),
    };
    persist({ ...stored, leaves: [...stored.leaves, rec] }, 'leave', rec);
    alert('Leave application saved.');
  };

  const handleCaptureLocation = () => {
    setGeoStatus(null);
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          address = await reverseGeocode(lat, lng);
        } catch { /* ignore */ }
        const loc = {
          lat,
          lng,
          address,
          capturedAt: new Date().toISOString(),
        };
        const dayData = { ...(stored.days[todayStr] || {}), date: todayStr, location: loc };
        persist({
          ...stored,
          days: {
            ...stored.days,
            [todayStr]: dayData,
          },
        }, 'attendance', dayData);
        setGeoStatus('Location updated.');
      },
      () => setGeoStatus('Permission denied or location unavailable.'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const calendarWeeks = useMemo(() => {
    const start = new Date(monthStart);
    const dow = start.getDay();
    start.setDate(start.getDate() - dow);
    const weeks: Date[][] = [];
    let cur = new Date(start);
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(row);
    }
    return weeks;
  }, [monthStart]);

  const selectedDetail = selectedDay ? stored.days[selectedDay] : null;
  const selectedLeave = selectedDay ? getLeaveOnDay(selectedDay) : null;

  const showAttendance = mode === 'attendance' || mode === 'both';
  const showLeave = mode === 'leave' || mode === 'both';

  return (
    <div className="space-y-4">
      {mode === 'both' && (
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 pt-4 border-t border-slate-700">
          <Calendar className="w-4 h-4 text-blue-400" />
          Attendance &amp; Leaves
        </h3>
      )}
      
      <p className="text-xs text-slate-500">
        Standard hours: <span className="text-slate-400 font-medium">{WORK_LABEL}</span>
        {showLeave && <> {' · '} {ANNUAL_PAID_LEAVES} paid leave days / year</>}
      </p>

      {/* Stats */}
      <div className={`grid ${showAttendance && showLeave ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
        {showLeave ? (
          <>
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Leaves (Month)</p>
              <p className="text-lg font-bold text-amber-400">{leavesUsedThisMonth.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500">applied</p>
            </div>
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Leaves (Year)</p>
              <p className="text-lg font-bold text-emerald-400">{leavesUsedThisYear.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500">of {ANNUAL_PAID_LEAVES} limit</p>
            </div>
          </>
        ) : null}
        {showAttendance ? (
          <>
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg. Hours</p>
              <p className="text-lg font-bold text-blue-400">{avgWorkingHours.toFixed(1)}h</p>
              <p className="text-[10px] text-slate-500">per day</p>
            </div>
            <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Days Present</p>
              <p className="text-lg font-bold text-indigo-400">{presentDaysThisMonth}</p>
              <p className="text-[10px] text-slate-500">this month</p>
            </div>
          </>
        ) : null}
        <div className="rounded-lg bg-slate-900/80 border border-slate-700 p-3 text-center col-span-full">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Today</p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5 text-green-400" />
              {todayRecord?.loginTime ? formatTime(todayRecord.loginTime) : '—'}
            </span>
            <span className="inline-flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              {todayRecord?.logoutTime ? formatTime(todayRecord.logoutTime) : '—'}
            </span>
            {hasLeaveOn(todayStr) && (
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Palmtree className="w-3.5 h-3.5" />
                Leave
              </span>
            )}
          </div>
        </div>
      </div>

      {showAttendance && (
        <>
          {/* Today actions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCheckIn}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-700/80 hover:bg-green-600 text-white text-xs font-medium transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Check in
              </button>
              {todayRecord?.checkInLocation && (
                <div className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">In Location</p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    <MapPin className="w-2.5 h-2.5 inline mr-1 text-green-500" />
                    {todayRecord.checkInLocation.address}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCheckOut}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-xs font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Check out
              </button>
              {todayRecord?.checkOutLocation && (
                <div className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Out Location</p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    <MapPin className="w-2.5 h-2.5 inline mr-1 text-amber-500" />
                    {todayRecord.checkOutLocation.address}
                  </p>
                </div>
              )}
            </div>
          </div>
          {(clockStatus || geoStatus) && (
            <p className="text-xs text-slate-400">{clockStatus || geoStatus}</p>
          )}

          {/* Location details for selected day (if not today or if today has legacy location) */}
          {selectedDay && selectedDay !== todayStr && stored.days[selectedDay]?.location && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-1">
              <span className="text-[10px] uppercase tracking-wide text-slate-500 block">
                Location ({selectedDay})
              </span>
              <p className="text-xs text-slate-300 leading-snug flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                {stored.days[selectedDay].location!.address}
              </p>
            </div>
          )}
        </>
      )}

      {/* Calendar */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() =>
              setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
            }
            className="p-1 rounded hover:bg-slate-700 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white">
            {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
            }
            className="p-1 rounded hover:bg-slate-700 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-slate-500 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="space-y-0.5">
          {calendarWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5">
              {week.map((d) => {
                const key = ymd(d);
                const inMonth = d.getMonth() === calendarMonth.getMonth();
                const att = stored.days[key];
                const leave = getLeaveOnDay(key);
                const isToday = key === todayStr;
                return (
                  <button
                    type="button"
                    key={key + wi}
                    onClick={() => setSelectedDay(key)}
                    className={[
                      'aspect-square max-h-9 rounded text-[11px] font-medium transition',
                      inMonth ? 'text-slate-200' : 'text-slate-600',
                      att?.loginTime && !leave ? 'bg-emerald-900/50 ring-1 ring-emerald-700/50' : '',
                      leave ? 'bg-amber-900/40 ring-1 ring-amber-600/40' : '',
                      !att?.loginTime && !leave && inMonth ? 'bg-slate-800/60' : '',
                      isToday ? 'ring-2 ring-blue-500 z-10' : '',
                      selectedDay === key ? 'ring-2 ring-blue-400' : '',
                    ].join(' ')}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2 flex flex-wrap gap-2">
          {showAttendance && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-800" /> Check-in
            </span>
          )}
          {showLeave && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-amber-800" /> Leave
            </span>
          )}
        </p>

        {selectedDay && (
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-200 text-sm">{selectedDay === todayStr ? 'Today' : selectedDay}</p>
              {selectedDetail?.loginTime && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 text-[10px] border border-emerald-800/50">
                  Present
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {showAttendance && selectedDetail?.loginTime && (
                <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/30">
                  <div className="flex items-center gap-2 text-slate-300 mb-1">
                    <LogIn className="w-3.5 h-3.5 text-green-400" />
                    <span className="font-medium">Check-In: {formatTime(selectedDetail.loginTime)}</span>
                  </div>
                  {selectedDetail.checkInLocation && (
                    <div className="flex items-start gap-1.5 pl-5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-400 leading-tight">{selectedDetail.checkInLocation.address}</p>
                    </div>
                  )}
                </div>
              )}

              {showAttendance && selectedDetail?.logoutTime && (
                <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/30">
                  <div className="flex items-center gap-2 text-slate-300 mb-1">
                    <LogOut className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium">Check-Out: {formatTime(selectedDetail.logoutTime)}</span>
                  </div>
                  {selectedDetail.checkOutLocation && (
                    <div className="flex items-start gap-1.5 pl-5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-400 leading-tight">{selectedDetail.checkOutLocation.address}</p>
                    </div>
                  )}
                </div>
              )}

              {showAttendance && selectedDetail?.location && !selectedDetail?.checkInLocation && !selectedDetail?.checkOutLocation && (
                <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/30">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-tight">{selectedDetail.location.address}</p>
                  </div>
                </div>
              )}

              {showLeave && selectedLeave && (
                <div className="bg-amber-900/20 rounded-lg p-2 border border-amber-800/30">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Palmtree className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      Leave: {selectedLeave.type === 'full' ? 'Full day' : selectedLeave.type === 'half_am' ? 'Half day (AM)' : 'Half day (PM)'}
                    </span>
                  </div>
                </div>
              )}

              {!selectedDetail?.loginTime && !selectedLeave && (
                <p className="text-slate-500 text-center py-2 italic">No records for this day.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showLeave && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5">
            <Palmtree className="w-3.5 h-3.5 text-amber-400" />
            Apply for leave
          </p>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-[10px] text-slate-500 uppercase">Date</label>
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white"
            />
            <label className="text-[10px] text-slate-500 uppercase">Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white"
            >
              <option value="full">Full day (1 day)</option>
              <option value="half_am">Half day — morning</option>
              <option value="half_pm">Half day — afternoon</option>
            </select>
            <button
              type="button"
              onClick={handleApplyLeave}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
            >
              Submit application
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
