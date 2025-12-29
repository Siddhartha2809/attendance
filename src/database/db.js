import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db = null;

// ==========================================
// 1. CORE DATABASE INITIALIZATION
// ==========================================
export const initDB = async () => {
  try {
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection('attendance_db', false)).result;

    if (Capacitor.getPlatform() === 'web') {
      await sqlite.initWebStore();
    }

    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection('attendance_db', false);
    } else {
      db = await sqlite.createConnection(
        'attendance_db',
        false,
        'no-encryption',
        1
      );
    }

    await db.open();

    // Create Tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT,
        Password TEXT,
        Department TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Staff (
        fac_id INTEGER PRIMARY KEY AUTOINCREMENT,
        fac_name TEXT,
        Password TEXT,
        dept TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        course_code TEXT,
        status TEXT,
        date TEXT,
        submission_time DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Admin
    await db.run(
      `INSERT OR IGNORE INTO Admin (id, Name, Password, Department) VALUES (?, ?, ?, ?)`,
      [1, 'admin', 'MIC@2026', 'ADMIN']
    );

    if (Capacitor.getPlatform() === 'web') {
        await sqlite.saveToStore('attendance_db');
    }

    return db;

  } catch (err) {
    console.error('❌ DB Init Error:', err);
    throw err;
  }
};

// ==========================================
// 2. HELPER EXPORTS (Aliases)
// ==========================================

// ✅ Fixes "Attempted import error: initAuthDB"
export const initAuthDB = initDB; 

export const runQuery = async (query, values = []) => {
  const database = await initDB();
  return await database.query(query, values);
};

export const runExecute = async (query, values = []) => {
  const database = await initDB();
  return await database.run(query, values);
};

// ==========================================
// 3. AUTHENTICATION LOGIC (Used by Login.js)
// ==========================================

// ✅ Save User to SQLite after successful Online Login
export const saveUserLocally = async (userData, password) => {
  const database = await initDB();
  
  try {
    if (userData.role === 'admin') {
      // Save Admin
      await database.run(
        `INSERT OR REPLACE INTO Admin (id, Name, Password, Department) VALUES (?, ?, ?, ?)`,
        [userData.id || userData.user_id, userData.username, password, 'ADMIN']
      );
    } else {
      // Save Staff
      await database.run(
        `INSERT OR REPLACE INTO Staff (fac_id, fac_name, Password, dept) VALUES (?, ?, ?, ?)`,
        [userData.id || userData.fac_id, userData.username, password, userData.department || 'CSE']
      );
    }
    
    // Web persistence
    if (Capacitor.getPlatform() === 'web') {
        await sqlite.saveToStore('attendance_db');
    }
    console.log("💾 Credentials saved locally for offline use");
  } catch (err) {
    console.error("❌ Failed to save user locally:", err);
  }
};

// ✅ Handle Offline Login (Check SQLite tables)
export const loginOffline = async (username, password) => {
  const database = await initDB();

  try {
    // 1. Check Admin Table
    const adminRes = await database.query(
      `SELECT * FROM Admin WHERE Name = ? AND Password = ?`, 
      [username, password]
    );

    if (adminRes.values.length > 0) {
      const user = adminRes.values[0];
      return { 
        id: user.id, 
        name: user.Name, 
        role: 'admin', 
        department: user.Department 
      };
    }

    // 2. Check Staff Table
    const staffRes = await database.query(
      `SELECT * FROM Staff WHERE fac_name = ? AND Password = ?`, 
      [username, password]
    );

    if (staffRes.values.length > 0) {
      const user = staffRes.values[0];
      return { 
        id: user.fac_id, 
        name: user.fac_name, 
        role: 'faculty', 
        department: user.dept 
      };
    }

    return null; // Login Failed

  } catch (err) {
    console.error("❌ Offline Login Error:", err);
    return null;
  }
};