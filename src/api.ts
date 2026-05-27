import { Student, User } from '../types';

const API_BASE = '/api';

export interface StudentPage {
  rows: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  total: number;
  statusDistribution: { label: string; count: number }[];
  serviceDistribution: { label: string; count: number }[];
  overdue: number;
  dueToday: number;
  finalised: number;
  converted: number;
  countryDistribution: { label: string; count: number }[];
}

/** Parse JSON fields returned from the server so the frontend always gets arrays/objects */
function parseStudentRow(s: any): Student {
  const parse = (key: string, fallback: any) => {
    if (s[key] === null || s[key] === undefined) return fallback;
    if (typeof s[key] === 'string') {
      try { return JSON.parse(s[key]); } catch { return fallback; }
    }
    return s[key];
  };
  return {
    ...s,
    preferredCountries:   parse('preferredCountries',   []),
    chatHistory:          parse('chatHistory',           []),
    emergencyContact:     parse('emergencyContact',      { name: '', email: '', phone: '', relation: '' }),
    credentials:          parse('credentials',           []),
    documents:            parse('documents',             []),
    tasks:                parse('tasks',                 []),
    detailedNotes:        parse('detailedNotes',         []),
    history:              parse('history',               []),
    completedJourneySteps:parse('completedJourneySteps', []),
    extendedDetails:      parse('extendedDetails',       undefined),
    journeyRecords:       parse('journeyRecords',        []),
    collaborators:        parse('collaborators',         []),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try { const body = await res.json(); errMsg = body.error || errMsg; } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

/**
 * Fetch with automatic retry on 503 (server warming up DB connection).
 * Retries up to `maxRetries` times with exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 5,
  baseDelayMs = 1500
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 503) return res;          // success or a real error — pass through
    lastError = new Error(`HTTP 503 (attempt ${attempt + 1}/${maxRetries + 1})`);
    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(1.5, attempt);   // 1.5s, 2.25s, 3.4s …
      console.warn(`[API] Server not ready (503), retrying in ${Math.round(delay)}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export const api = {
  // ── Stats ────────────────────────────────────────────────────────────────
  async fetchStats(requesterUserId?: string, role?: string): Promise<DashboardStats> {
    const qs = new URLSearchParams();
    if (requesterUserId) qs.set('requesterUserId', requesterUserId);
    if (role)            qs.set('requesterRole',   role);
    const res = await fetchWithRetry(`${API_BASE}/stats?${qs}`);
    return handleResponse<DashboardStats>(res);
  },

  // ── Students ─────────────────────────────────────────────────────────────
  async fetchStudents(params: {
    page?: number; limit?: number; search?: string;
    status?: string; service?: string; assigned?: string;
    sort?: string; dir?: string;
    requesterUserId?: string; requesterRole?: string;
  } = {}): Promise<StudentPage> {
    const qs = new URLSearchParams();
    if (params.page)      qs.set('page',     String(params.page));
    if (params.limit)     qs.set('limit',    String(params.limit));
    if (params.search)    qs.set('search',   params.search);
    if (params.status)    qs.set('status',   params.status);
    if (params.service)   qs.set('service',  params.service);
    if (params.assigned)  qs.set('assigned', params.assigned);
    if (params.sort)      qs.set('sort',     params.sort);
    if (params.dir)       qs.set('dir',      params.dir);
    if (params.requesterUserId) qs.set('requesterUserId', params.requesterUserId);
    if (params.requesterRole)   qs.set('requesterRole',   params.requesterRole);

    const res  = await fetchWithRetry(`${API_BASE}/students?${qs}`);
    const data = await handleResponse<any>(res);
    return {
      rows:       data.rows.map(parseStudentRow),
      total:      data.total,
      page:       data.page,
      limit:      data.limit,
      totalPages: data.totalPages,
    };
  },

  async createStudent(student: Partial<Student>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/students`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(student),
    });
    return handleResponse<{ id: number }>(res);
  },

  async updateStudent(id: number, updates: Partial<Student>): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    });
    return handleResponse<void>(res);
  },

  async deleteStudent(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ success: boolean; user?: User }> {
    const res = await fetch(`${API_BASE}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim(), password }),
    });
    if (res.status === 401) return { success: false };
    return handleResponse<{ success: boolean; user?: User }>(res);
  },

  // ── Employees ─────────────────────────────────────────────────────────────
  async fetchEmployees(requesterUserId?: string, requesterRole?: string): Promise<User[]> {
    const qs = new URLSearchParams();
    if (requesterUserId) qs.set('requesterUserId', requesterUserId);
    if (requesterRole)   qs.set('requesterRole',   requesterRole);
    const res = await fetch(`${API_BASE}/employees?${qs}`);
    return handleResponse<User[]>(res);
  },

  /** Creates or updates an employee (upsert). */
  async upsertEmployee(employee: User): Promise<void> {
    const res = await fetch(`${API_BASE}/employees`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(employee),
    });
    return handleResponse<void>(res);
  },

  async deleteEmployee(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
    return handleResponse<void>(res);
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  async fetchAttendance(userId: string): Promise<{ days: any; leaves: any[] }> {
    const res = await fetch(`${API_BASE}/attendance/${userId}`);
    return handleResponse<{ days: any; leaves: any[] }>(res);
  },

  async updateAttendance(userId: string, data: any): Promise<void> {
    const res = await fetch(`${API_BASE}/attendance/${userId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    return handleResponse<void>(res);
  },

  // ── Leaves ────────────────────────────────────────────────────────────────
  async addLeave(userId: string, leave: any): Promise<void> {
    const res = await fetch(`${API_BASE}/leaves/${userId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(leave),
    });
    return handleResponse<void>(res);
  },
};
