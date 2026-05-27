import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3307'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'dashboard',
};

async function seed() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM students');
    if (rows[0].count === 0) {
      console.log('Seeding sample students...');
      const students = [
        ['SC26000001', 'John Doe', 'john@example.com', '+91 9999988881', 'New', 'Study Abroad', '2026-05-01', '[]'],
        ['SC26000002', 'Jane Smith', 'jane@example.com', '+91 9999988882', 'Follow-up', 'Visa Services', '2026-04-30', '[]'],
        ['SC26000003', 'Rahul Kumar', 'rahul@example.com', '+91 9999988883', 'Interested', 'Test Prep', '2026-05-05', '[]'],
      ];

      for (const s of students) {
        await connection.query(
          'INSERT INTO students (studentId, fullName, email, mobile, leadStatus, serviceCategory, followUpDate, preferredCountries, createdDate, lastModifiedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          s
        );
      }
      console.log('Seeding complete.');
    } else {
      console.log('Database already has data. Skipping seed.');
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await connection.end();
  }
}

seed();
