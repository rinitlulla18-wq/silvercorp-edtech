import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dashboard',
};

async function migrate() {
  const mockPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(mockPath)) {
    console.log('No db.json found. Skipping migration.');
    return;
  }

  const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
  console.log(`Migrating ${mockData.students.length} students and ${mockData.attendance.length} attendance records...`);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Create Tables first
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentId VARCHAR(50) UNIQUE,
        fullName VARCHAR(255),
        email VARCHAR(255),
        mobile VARCHAR(50),
        preferredCountries JSON,
        avatarUrl TEXT,
        notes TEXT,
        leadStatus VARCHAR(50),
        serviceCategory VARCHAR(100),
        followUpDate DATE,
        createdDate DATETIME,
        lastModifiedDate DATETIME,
        chatHistory JSON,
        emergencyContact JSON,
        credentials JSON,
        documents JSON,
        tasks JSON,
        detailedNotes JSON,
        history JSON,
        assignedUserId VARCHAR(50),
        completedJourneySteps JSON,
        extendedDetails JSON
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        fullName VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        mobile VARCHAR(50),
        homeAddress TEXT,
        emergencyContact TEXT,
        avatarUrl TEXT,
        role VARCHAR(50)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(50),
        date VARCHAR(20),
        loginTime DATETIME,
        logoutTime DATETIME,
        checkInLocation JSON,
        checkOutLocation JSON,
        location JSON,
        UNIQUE KEY user_date (userId, date)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50),
        date VARCHAR(20),
        type VARCHAR(20),
        submittedAt DATETIME
      )
    `);

    // Migrate Students
    for (const s of mockData.students) {
      const data = { ...s };
      delete data.id; // Let auto-increment handle it
      
      const jsonFields = [
        'preferredCountries', 'chatHistory', 'emergencyContact', 'credentials', 
        'documents', 'tasks', 'detailedNotes', 'history', 
        'completedJourneySteps', 'extendedDetails'
      ];
      
      jsonFields.forEach(key => {
        if (data[key] !== undefined) {
          data[key] = JSON.stringify(data[key]);
        } else {
          data[key] = JSON.stringify([]); // Default for missing arrays
        }
      });

      await connection.query('INSERT IGNORE INTO students SET ?', data);
    }

    // Migrate Attendance
    for (const a of mockData.attendance) {
      const data = { ...a };
      ['checkInLocation', 'checkOutLocation', 'location'].forEach(key => {
        if (data[key] !== undefined) {
          data[key] = JSON.stringify(data[key]);
        }
      });
      await connection.query('INSERT IGNORE INTO attendance SET ?', data);
    }

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
