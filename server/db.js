const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('attendance.db', { verbose: console.log });

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    descriptor TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

const registerUser = (name, descriptor) => {
    const stmt = db.prepare('INSERT INTO users (name, descriptor) VALUES (?, ?)');
    const info = stmt.run(name, descriptor);
    return info.lastInsertRowid;
};

const getAllUsers = () => {
    const stmt = db.prepare('SELECT * FROM users');
    return stmt.all();
};

const logAttendance = (userId) => {
    const stmt = db.prepare('INSERT INTO attendance (user_id) VALUES (?)');
    const info = stmt.run(userId);
    return info.lastInsertRowid;
};

const getAttendanceLogs = () => {
    const stmt = db.prepare(`
    SELECT a.id, a.timestamp, u.name 
    FROM attendance a 
    JOIN users u ON a.user_id = u.id 
    ORDER BY a.timestamp DESC
  `);
    return stmt.all();
};

module.exports = {
    registerUser,
    getAllUsers,
    logAttendance,
    getAttendanceLogs
};
