import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const distPath = path.resolve(__dirname, 'dist');
console.log(`[Server] Static assets path: ${distPath}`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Database Configuration ───────────────────────────────────────────────────

const dbConfig = {
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '1234',
  database:          process.env.DB_NAME     || 'dashboard',
  connectionLimit:   10,
  waitForConnections: true,
  queueLimit:        0,
  enableKeepAlive:   true,
  keepAliveInitialDelay: 10000,
  connectTimeout:    20000,
};

if (process.env.INSTANCE_CONNECTION_NAME) {
  dbConfig.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
} else {
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
  dbConfig.port = parseInt(process.env.DB_PORT || '3306');
}

let pool;

// ─── Schema Definition ────────────────────────────────────────────────────────
// This is the single source of truth.
// ADD NEW COLUMNS HERE — they will auto-migrate in the live database on next deploy.

const STUDENT_SCHEMA = {
  // scalar columns
  scalar: {
    studentId:       'VARCHAR(50)',
    fullName:        'VARCHAR(255)',
    email:           'VARCHAR(255)',
    mobile:          'VARCHAR(50)',
    avatarUrl:       'MEDIUMTEXT',
    notes:           'TEXT',
    leadStatus:      'VARCHAR(50)',
    serviceCategory: 'VARCHAR(100)',
    followUpDate:    'DATE',
    createdDate:     'DATETIME',
    lastModifiedDate:'DATETIME',
    assignedUserId:  'VARCHAR(50)',
  },
  // JSON columns — stored as JSON, sent/received as objects/arrays
  json: {
    preferredCountries:   'JSON',
    chatHistory:          'JSON',
    emergencyContact:     'JSON',
    credentials:          'JSON',
    documents:            'JSON',
    tasks:                'JSON',
    detailedNotes:        'JSON',
    history:              'JSON',
    completedJourneySteps:'JSON',
    extendedDetails:      'JSON',
    journeyRecords:       'JSON',
    collaborators:        'JSON',
  },
};

// All valid column names as a Set for fast lookup
const ALL_COLUMNS = new Set([
  ...Object.keys(STUDENT_SCHEMA.scalar),
  ...Object.keys(STUDENT_SCHEMA.json),
]);

const JSON_COLUMNS = new Set(Object.keys(STUDENT_SCHEMA.json));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely serialize a value for a JSON database column.
 * - Skips File objects (browser-only, non-serializable)
 * - Returns null for undefined/null so the DB stores NULL
 */
function serializeJsonColumn(key, value) {
  if (value === undefined || value === null) return null;
  try {
    if (key === 'documents' && Array.isArray(value)) {
      // Strip File objects — only keep metadata that is safe to store
      const safe = value.map(d => ({
        id:         d.id,
        name:       d.file?.name || d.name || '',
        status:     d.status,
        progress:   d.progress,
        uploadedBy: d.uploadedBy,
        uploadedAt: d.uploadedAt,
      }));
      return JSON.stringify(safe);
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Formats a date value for MySQL DATE/DATETIME columns.
 * MySQL expects 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'.
 * Frontend often sends ISO strings like '2026-04-01T00:00:00.000Z'.
 */
function formatMySqlDate(value, includeTime = true) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!includeTime) return datePart;
    
    const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return `${datePart} ${timePart}`;
  } catch {
    return null;
  }
}

/**
 * Build the DB payload for a student record.
 * Only includes columns that exist in STUDENT_SCHEMA.
 * Unknown fields from the frontend are silently dropped (SQL injection safe).
 *
 * @param {object} body     - Raw request body from frontend
 * @param {boolean} forInsert - If true, include JSON defaults for missing columns
 */
function buildStudentPayload(body, forInsert = false) {
  const data = {};

  for (const key of ALL_COLUMNS) {
    const value = body[key];

    if (JSON_COLUMNS.has(key)) {
      if (value !== undefined) {
        data[key] = serializeJsonColumn(key, value);
      } else if (forInsert) {
        // Default empty arrays for required JSON columns on insert
        data[key] = JSON.stringify([]);
      }
    } else if (['followUpDate', 'createdDate', 'lastModifiedDate'].includes(key)) {
      if (value !== undefined) {
        data[key] = formatMySqlDate(value, key !== 'followUpDate');
      }
    } else {
      if (value !== undefined) {
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Parse JSON columns when reading from DB so the frontend always gets objects.
 */
// Columns that must always be arrays (never objects or null)
const ARRAY_JSON_COLUMNS = new Set([
  'preferredCountries', 'chatHistory', 'credentials', 'documents',
  'tasks', 'detailedNotes', 'history', 'completedJourneySteps',
  'journeyRecords', 'collaborators',
]);

function parseStudentRow(row) {
  if (!row) return row;
  const out = { ...row };
  for (const key of JSON_COLUMNS) {
    if (typeof out[key] === 'string') {
      try {
        const parsed = JSON.parse(out[key]);
        // If this column must be an array but parsed as something else, default to []
        out[key] = ARRAY_JSON_COLUMNS.has(key) && !Array.isArray(parsed) ? [] : parsed;
      } catch {
        out[key] = ARRAY_JSON_COLUMNS.has(key) ? [] : null;
      }
    } else if (out[key] === null || out[key] === undefined) {
      // Null from DB: default arrays to [], objects to null
      out[key] = ARRAY_JSON_COLUMNS.has(key) ? [] : (out[key] ?? null);
    } else if (ARRAY_JSON_COLUMNS.has(key) && !Array.isArray(out[key])) {
      // Already parsed by MySQL driver but wrong type
      out[key] = [];
    }
  }
  // Ensure dates are stringified in a format the frontend expects (ISO)
  if (out.followUpDate) out.followUpDate = new Date(out.followUpDate).toISOString().split('T')[0];
  if (out.createdDate) out.createdDate = new Date(out.createdDate).toISOString();
  if (out.lastModifiedDate) out.lastModifiedDate = new Date(out.lastModifiedDate).toISOString();
  return out;
}

// ─── Database Initialisation & Migration ─────────────────────────────────────

async function initializeDatabase() {
  // 1. Create the students table with all current columns
  const scalarDefs = Object.entries(STUDENT_SCHEMA.scalar)
    .map(([col, type]) => `  ${col} ${type}`)
    .join(',\n');
  const jsonDefs = Object.entries(STUDENT_SCHEMA.json)
    .map(([col, type]) => `  ${col} ${type}`)
    .join(',\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      studentId VARCHAR(50) UNIQUE,
${scalarDefs.split(',\n').filter(l => !l.includes('studentId')).join(',\n')},
${jsonDefs}
    )
  `);

  // 2. Auto-migration: add any columns defined in schema that don't exist yet
  const [existingCols] = await pool.query('SHOW COLUMNS FROM students');
  const existingNames = new Set(existingCols.map(c => c.Field));

  for (const [col, type] of [
    ...Object.entries(STUDENT_SCHEMA.scalar),
    ...Object.entries(STUDENT_SCHEMA.json),
  ]) {
    if (!existingNames.has(col)) {
      console.log(`[Migration] Adding column '${col}' (${type}) to students table`);
      await pool.query(`ALTER TABLE students ADD COLUMN \`${col}\` ${type}`);
    } else if (col === 'avatarUrl') {
      // Ensure avatarUrl is always MEDIUMTEXT for base64 support
      await pool.query(`ALTER TABLE students MODIFY COLUMN \`avatarUrl\` MEDIUMTEXT`);
    }
  }

  // 3. Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           VARCHAR(50)  PRIMARY KEY,
      fullName     VARCHAR(255),
      email        VARCHAR(255) UNIQUE,
      password     VARCHAR(255),
      mobile       VARCHAR(50),
      homeAddress  TEXT,
      emergencyContact TEXT,
      avatarUrl    TEXT,
      role         VARCHAR(50),
      roleCategory VARCHAR(50),
      organisationName VARCHAR(255)
    )
  `);

  // Auto-migrate users table
  const [userCols] = await pool.query('SHOW COLUMNS FROM users');
  const userColNames = new Set(userCols.map(c => c.Field));
  const userMigrations = [
    { name: 'homeAddress',       type: 'TEXT' },
    { name: 'emergencyContact',  type: 'TEXT' },
    { name: 'avatarUrl',         type: 'TEXT' },
    { name: 'mobile',            type: 'VARCHAR(50)' },
    { name: 'roleCategory',      type: 'VARCHAR(50)' },
    { name: 'organisationName',  type: 'VARCHAR(255)' },
  ];
  for (const m of userMigrations) {
    if (!userColNames.has(m.name)) {
      console.log(`[Migration] Adding users column '${m.name}'`);
      await pool.query(`ALTER TABLE users ADD COLUMN \`${m.name}\` ${m.type}`);
    }
  }

  // 4. Attendance table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      userId          VARCHAR(50),
      date            VARCHAR(20),
      loginTime       DATETIME,
      logoutTime      DATETIME,
      checkInLocation JSON,
      checkOutLocation JSON,
      location        JSON,
      UNIQUE KEY user_date (userId, date)
    )
  `);

  // 5. Leaves table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaves (
      id          VARCHAR(50) PRIMARY KEY,
      userId      VARCHAR(50),
      date        VARCHAR(20),
      type        VARCHAR(20),
      submittedAt DATETIME
    )
  `);

  // 6. Seed the default users
  const seedUsers = [
    {
      id: 'USR-2026-001',
      fullName: 'SilverCorp Admin',
      email: 'admin@silvercorp.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      id: 'USR-2026-RINIT',
      fullName: 'Rinit Lulla',
      email: 'rinitlulla18@gmail.com',
      password: 'admin123',
      role: 'employee'
    },
    {
      id: 'USR-2026-MGR',
      fullName: 'SilverCorp Manager',
      email: 'manager@silvercorp.com',
      password: 'pass',
      role: 'employee'
    }
  ];

  for (const u of seedUsers) {
    await pool.query(`
      INSERT IGNORE INTO users (id, fullName, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `, [u.id, u.fullName, u.email, u.password, u.role]);
  }

  // 7. Force Update Role for Rinit (ensure migration takes effect)
  await pool.query("UPDATE users SET role = 'employee' WHERE email = 'rinitlulla18@gmail.com'");

  // 8. Seed Sample Students if table is empty
  const [studentRows] = await pool.query('SELECT COUNT(*) as count FROM students');
  if (studentRows[0].count === 0) {
    console.log('[DB] Seeding sample students...');
    const students = [
      ['SC26000001', 'John Doe', 'john@example.com', '+91 9999988881', 'New', 'Study Abroad', '2026-05-01', '[]'],
      ['SC26000002', 'Jane Smith', 'jane@example.com', '+91 9999988882', 'Follow-up', 'Visa Services', '2026-04-30', '[]'],
      ['SC26000003', 'Rahul Kumar', 'rahul@example.com', '+91 9999988883', 'Interested', 'Test Prep', '2026-05-05', '[]'],
    ];

    for (const s of students) {
      await pool.query(
        'INSERT INTO students (studentId, fullName, email, mobile, leadStatus, serviceCategory, followUpDate, preferredCountries, createdDate, lastModifiedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        s
      );
    }
    console.log('[DB] Seeding complete.');
  }

  // 9. Assign sample leads to Rinit so dashboard isn't empty
  await pool.query(`
    UPDATE students 
    SET assignedUserId = 'USR-2026-RINIT' 
    WHERE assignedUserId IS NULL OR assignedUserId = ''
    LIMIT 3
  `);

  // 10. Migration: Update Student ID prefix from STU to SC if any exist
  const [updateResult] = await pool.query(`
    UPDATE students 
    SET studentId = REPLACE(studentId, 'STU', 'SC') 
    WHERE studentId LIKE 'STU%'
  `);
  if (updateResult && updateResult.affectedRows > 0) {
    console.log(`[Migration] Updated ${updateResult.affectedRows} student IDs from STU to SC`);
  }

  // 8. Diagnostic: Log all users in DB
  const [users] = await pool.query('SELECT id, email, role FROM users');
  console.log(`[DB] Current users (${users.length}):`, users.map(u => u.email));

  console.log('[DB] Schema initialised and up-to-date');
}

// ─── Connection with retry ────────────────────────────────────────────────────

async function connectToDatabase(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      pool = mysql.createPool(dbConfig);
      await pool.query('SELECT 1'); // Test connection
      console.log('[DB] Connected to MySQL/Cloud SQL');
      await initializeDatabase();
      return;
    } catch (err) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        console.log(`[DB] Retrying in ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        console.error('[DB] All connection attempts failed. Server will start without database.');
      }
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

function requireDb(req, res, next) {
  if (!pool) return res.status(503).json({ error: 'Database not connected. Please try again shortly.' });
  next();
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {
  try {
    if (pool) {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'degraded', db: 'disconnected' });
    }
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'error', error: err.message });
  }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

app.get('/api/stats', requireDb, async (req, res) => {
  try {
    const requesterId   = req.query.requesterUserId;
    const requesterRole = req.query.requesterRole;

    let where  = 'WHERE 1=1';
    const params = [];

    // RBAC: If not admin, only show stats for assigned leads (Secure by default)
    const isAdmin = requesterRole && requesterRole.toLowerCase() === 'admin';
    
    if (!isAdmin) {
      if (requesterId) {
        where += ' AND assignedUserId = ?';
        params.push(requesterId);
      } else {
        // Safe fallback
        where += ' AND 1=0';
      }
    }

    const today = new Date().toISOString().split('T')[0];

    const [[{ total }]]     = await pool.query(`SELECT COUNT(*) AS total FROM students ${where}`, params);
    const [statusRows]      = await pool.query(`SELECT leadStatus AS label, COUNT(*) AS count FROM students ${where} GROUP BY leadStatus`, params);
    const [serviceRows]     = await pool.query(`SELECT serviceCategory AS label, COUNT(*) AS count FROM students ${where} GROUP BY serviceCategory`, params);
    const [[{ overdue }]]   = await pool.query(`SELECT COUNT(*) AS overdue   FROM students ${where} AND followUpDate < ? AND leadStatus NOT IN ('Lost','Finalised')`, [...params, today]);
    const [[{ dueToday }]]  = await pool.query(`SELECT COUNT(*) AS dueToday  FROM students ${where} AND followUpDate = ? AND leadStatus NOT IN ('Lost','Finalised')`, [...params, today]);
    const [[{ finalised }]] = await pool.query(`SELECT COUNT(*) AS finalised FROM students ${where} AND leadStatus = 'Finalised'`, params);
    const [[{ converted }]] = await pool.query(`SELECT COUNT(*) AS converted FROM students ${where} AND leadStatus = 'Converted'`, params);

    // Country distribution — parse from JSON column server-side
    const [countryRows] = await pool.query(`SELECT preferredCountries FROM students ${where}`, params);
    const countryCounts = {};
    for (const row of countryRows) {
      const countries = typeof row.preferredCountries === 'string'
        ? JSON.parse(row.preferredCountries)
        : row.preferredCountries;
      if (Array.isArray(countries)) {
        for (const c of countries) {
          countryCounts[c] = (countryCounts[c] || 0) + 1;
        }
      }
    }

    res.json({
      total,
      statusDistribution:  statusRows,
      serviceDistribution: serviceRows,
      overdue,
      dueToday,
      finalised,
      converted,
      countryDistribution: Object.entries(countryCounts).map(([label, count]) => ({ label, count })),
    });
  } catch (err) {
    console.error('[API /stats] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Students — List (paginated, filtered, sorted) ───────────────────────────

app.get('/api/students', requireDb, async (req, res) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page  || '1'));
    const limit     = Math.min(200, Math.max(1, parseInt(req.query.limit || '50')));
    const offset    = (page - 1) * limit;
    const search    = req.query.search  ? `%${req.query.search}%`  : null;
    const status    = req.query.status  || null;
    const service   = req.query.service || null;
    const assigned  = req.query.assigned || null;
    
    // RBAC: Enforce assignedUser filter for non-admins (Secure by default)
    const requesterId   = req.query.requesterUserId;
    const requesterRole = req.query.requesterRole;

    let where  = 'WHERE 1=1';
    const params = [];

    const isAdmin = requesterRole && requesterRole.toLowerCase() === 'admin';

    if (!isAdmin) {
      if (requesterId) {
        // Employee: Restrict to assigned leads
        where += ' AND assignedUserId = ?';
        params.push(requesterId);
      } else {
        // No ID/Role: Fail safe and return nothing
        where += ' AND 1=0';
      }
    }

    if (search) {
      where += ' AND (fullName LIKE ? OR email LIKE ? OR mobile LIKE ? OR studentId LIKE ? OR notes LIKE ?)';
      params.push(search, search, search, search, search);
    }
    if (status)   { where += ' AND leadStatus = ?';       params.push(status); }
    if (service)  { where += ' AND serviceCategory = ?';  params.push(service); }
    if (assigned === 'unassigned') {
      where += ' AND (assignedUserId IS NULL OR assignedUserId = "")';
    } else if (assigned) {
      where += ' AND assignedUserId = ?';
      params.push(assigned);
    }

    const ALLOWED_SORT = new Set(['fullName','leadStatus','followUpDate','lastModifiedDate','serviceCategory','createdDate','studentId']);
    const sortKey = ALLOWED_SORT.has(req.query.sort) ? req.query.sort : 'lastModifiedDate';
    const sortDir = req.query.dir === 'asc' ? 'ASC' : 'DESC';

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM students ${where}`, params);
    const [rows]        = await pool.query(
      `SELECT * FROM students ${where} ORDER BY ${sortKey} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({
      rows:       rows.map(parseStudentRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[API GET /students] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Students — Create ────────────────────────────────────────────────────────

app.post('/api/students', requireDb, async (req, res) => {
  const { fullName } = req.body;
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });

  const data = buildStudentPayload(req.body, true);
  data.createdDate     = data.createdDate     || new Date();
  data.lastModifiedDate = new Date();

  try {
    const [result] = await pool.query('INSERT INTO students SET ?', data);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('[API POST /students] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Students — Update (partial) ─────────────────────────────────────────────

app.patch('/api/students/:id', requireDb, async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (!Number.isFinite(studentId)) return res.status(400).json({ error: 'Invalid student ID' });

  const data = buildStudentPayload(req.body, false);
  data.lastModifiedDate = new Date();

  // Ensure we have at least one column to update beyond lastModifiedDate
  if (Object.keys(data).length <= 1) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const [result] = await pool.query('UPDATE students SET ? WHERE id = ?', [data, studentId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Student with id ${studentId} not found` });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(`[API PATCH /students/${studentId}] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Students — Delete ────────────────────────────────────────────────────────

app.delete('/api/students/:id', requireDb, async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (!Number.isFinite(studentId)) return res.status(400).json({ error: 'Invalid student ID' });

  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [studentId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(`[API DELETE /students/${studentId}] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Employees ────────────────────────────────────────────────────────────────

app.get('/api/employees', requireDb, async (req, res) => {
  try {
    const requesterId   = req.query.requesterUserId;
    const requesterRole = req.query.requesterRole;

    let where = "WHERE 1=1";
    // If not admin, hide other admins for security
    if (requesterRole && requesterRole.toLowerCase() !== 'admin') {
      where += " AND role != 'admin'";
    }

    const [rows] = await pool.query(
      `SELECT id, fullName, email, mobile, homeAddress, emergencyContact, avatarUrl, role,
              COALESCE(roleCategory,'') AS roleCategory,
              COALESCE(organisationName,'') AS organisationName
       FROM users ${where}`
    );
    res.json(rows);
  } catch (err) {
    console.error('[API GET /employees] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upsert: used for both create and edit employee
app.post('/api/employees', requireDb, async (req, res) => {
  const { fullName, email } = req.body;
  let { id } = req.body;

  if (!fullName || !email) return res.status(400).json({ error: 'fullName and email are required' });

  // Auto-generate ID if missing
  if (!id) {
    const year = new Date().getFullYear();
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM users');
    id = `USR-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }

  const allowed = ['id','fullName','email','password','mobile','homeAddress','emergencyContact','avatarUrl','role','roleCategory','organisationName'];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  data.id = id; // Ensure the generated/provided ID is used

  try {
    await pool.query(
      'INSERT INTO users SET ? ON DUPLICATE KEY UPDATE fullName=VALUES(fullName), email=VALUES(email), mobile=VALUES(mobile), homeAddress=VALUES(homeAddress), emergencyContact=VALUES(emergencyContact), avatarUrl=VALUES(avatarUrl), role=VALUES(role), roleCategory=VALUES(roleCategory), organisationName=VALUES(organisationName)',
      data
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[API POST /employees] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', requireDb, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ? AND role != 'admin'", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found or cannot delete admin' });
    res.json({ success: true });
  } catch (err) {
    console.error(`[API DELETE /employees/${req.params.id}] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/login', requireDb, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' });

  try {
    const [users] = await pool.query(
      `SELECT id, fullName, email, mobile, homeAddress, emergencyContact, avatarUrl, role,
              COALESCE(roleCategory,'') AS roleCategory,
              COALESCE(organisationName,'') AS organisationName
       FROM users WHERE LOWER(email) = LOWER(?) AND password = ?`,
      [email.trim(), password]
    );
    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('[API POST /login] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Attendance ───────────────────────────────────────────────────────────────

app.get('/api/attendance/:userId', requireDb, async (req, res) => {
  try {
    const [days]   = await pool.query('SELECT * FROM attendance WHERE userId = ?', [req.params.userId]);
    const [leaves] = await pool.query('SELECT * FROM leaves    WHERE userId = ?', [req.params.userId]);

    const daysMap = {};
    for (const d of days) {
      daysMap[d.date] = {
        ...d,
        checkInLocation:  typeof d.checkInLocation  === 'string' ? JSON.parse(d.checkInLocation)  : d.checkInLocation,
        checkOutLocation: typeof d.checkOutLocation === 'string' ? JSON.parse(d.checkOutLocation) : d.checkOutLocation,
        location:         typeof d.location         === 'string' ? JSON.parse(d.location)         : d.location,
      };
    }

    res.json({ days: daysMap, leaves });
  } catch (err) {
    console.error(`[API GET /attendance/${req.params.userId}] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/:userId', requireDb, async (req, res) => {
  const d = { ...req.body, userId: req.params.userId };
  
  // Format dates for MySQL
  if (d.loginTime)  d.loginTime  = formatMySqlDate(d.loginTime);
  if (d.logoutTime) d.logoutTime = formatMySqlDate(d.logoutTime);

  for (const key of ['checkInLocation', 'checkOutLocation', 'location']) {
    if (d[key] && typeof d[key] !== 'string') d[key] = JSON.stringify(d[key]);
  }
  try {
    await pool.query('INSERT INTO attendance SET ? ON DUPLICATE KEY UPDATE loginTime=VALUES(loginTime), logoutTime=VALUES(logoutTime), checkInLocation=VALUES(checkInLocation), checkOutLocation=VALUES(checkOutLocation), location=VALUES(location)', d);
    res.json({ success: true });
  } catch (err) {
    console.error(`[API POST /attendance/${req.params.userId}] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Leaves ───────────────────────────────────────────────────────────────────

app.post('/api/leaves/:userId', requireDb, async (req, res) => {
  const l = { ...req.body, userId: req.params.userId };
  if (l.submittedAt) l.submittedAt = formatMySqlDate(l.submittedAt);
  
  try {
    await pool.query('INSERT IGNORE INTO leaves SET ?', l);
    res.json({ success: true });
  } catch (err) {
    console.error(`[API POST /leaves/${req.params.userId}] Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug-files', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const walk = async (dir) => {
      let files = await fs.readdir(dir);
      files = await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) return { name: file, type: 'dir', children: await walk(filePath) };
        return { name: file, type: 'file', size: stats.size };
      }));
      return files;
    };
    const files = await walk(distPath);
    res.json({ distPath, files });
  } catch (err) {
    res.status(500).json({ error: err.message, distPath });
  }
});

// ─── Static Frontend ──────────────────────────────────────────────────────────

app.use(express.static(distPath));
app.get('*', (req, res) => {
  console.log(`[Server] Catch-all route hit for: ${req.url}, serving index.html`);
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function startServer() {
  // 1. Start listening IMMEDIATELY so Cloud Run's health check / load balancer
  //    sees an HTTP server right away (avoids 503 on cold start).
  //    Requests that need the DB will get a 503 from requireDb() until the pool
  //    is ready, but the server itself is reachable within milliseconds.
  const server = app.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
    console.log(`[Server] Dashboard ready at http://localhost:${PORT}`);
  });

  // 2. Connect to DB in the background (non-blocking).
  //    requireDb() middleware will return 503 until pool is initialised.
  connectToDatabase().then(() => {
    console.log('[Server] Database ready — all API routes now fully operational.');
  }).catch((err) => {
    console.error('[Server] Background DB init failed:', err.message);
  });

  // 3. Setup graceful shutdown with the active server instance
  const shutdownHandler = (signal) => shutdown(signal, server);
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT',  () => shutdownHandler('SIGINT'));
}

/**
 * Modified shutdown to accept the server instance
 */
async function shutdown(signal, serverInstance) {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      if (pool) {
        await pool.end();
        console.log('[DB] Pool closed.');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  setTimeout(() => process.exit(1), 10000);
}

startServer();
