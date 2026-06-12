const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const api = {
  fetchStudents: async (params: any) => {
    const url = new URL(`${API_BASE}/api/students`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  fetchStats: async (userId: string, role: string) => {
    const res = await fetch(
      `${API_BASE}/api/stats?requesterUserId=${userId}&requesterRole=${role}`
    );
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  fetchEmployees: async (userId: string, role: string) => {
    const res = await fetch(
      `${API_BASE}/api/employees?requesterUserId=${userId}&requesterRole=${role}`
    );
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  createStudent: async (studentData: any) => {
    const res = await fetch(`${API_BASE}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    if (!res.ok) throw new Error('Failed to create student');
    return res.json();
  },

  updateStudent: async (id: number, studentData: any) => {
    const res = await fetch(`${API_BASE}/api/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    if (!res.ok) throw new Error('Failed to update student');
    return res.json();
  },

  deleteStudent: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/students/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete student');
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  upsertEmployee: async (employeeData: any) => {
    const res = await fetch(`${API_BASE}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData),
    });
    if (!res.ok) throw new Error('Failed to upsert employee');
    return res.json();
  },

  deleteEmployee: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/employees/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete employee');
    return res.json();
  },

  updateLogo: async (userId: string, logoUrl: string) => {
    const res = await fetch(`${API_BASE}/api/users/${userId}/logo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl }),
    });
    if (!res.ok) throw new Error('Failed to update logo');
    return res.json();
  },

  fetchLogo: async (userId: string) => {
    const res = await fetch(`${API_BASE}/api/users/${userId}/logo`);
    if (!res.ok) return { logoUrl: '' };
    return res.json();
  },

  fetchAttendance: async (userId: string) => {
    const res = await fetch(`${API_BASE}/api/attendance/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  updateAttendance: async (userId: string, data: any) => {
    const res = await fetch(`${API_BASE}/api/attendance/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update attendance');
    return res.json();
  },

  submitLeave: async (userId: string, leaveData: any) => {
    const res = await fetch(`${API_BASE}/api/leaves/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaveData),
    });
    if (!res.ok) throw new Error('Failed to submit leave');
    return res.json();
  },
};
