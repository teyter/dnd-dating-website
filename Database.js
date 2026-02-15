const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      pass TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 0,
      name TEXT NOT NULL,
      race TEXT NOT NULL,
      class TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      bio TEXT,
      image_path TEXT,
      looking_for TEXT,
      experience_level TEXT,
      timezone TEXT
    );
  `);

  function addColumnIfMissing(table, column, definition) {
    // Validate table and column names to prevent SQL injection
    // Only allow alphanumeric characters and underscores
    const safeTableName = table.replace(/[^a-zA-Z0-9_]/g, '');
    const safeColumnName = column.replace(/[^a-zA-Z0-9_]/g, '');
    
    // here we add additional validation, were we only allow known tables and columns
    const allowedTables = ['users', 'profiles'];
    if (!allowedTables.includes(safeTableName)) {
      console.error('Invalid table name:', safeTableName);
      return;
    }
    
    db.all(`PRAGMA table_info(${safeTableName});`, (err, rows) => {
      if (err) return console.error(err);
      const exists = rows.some(r => r.name === safeColumnName);
      if (!exists) {
        db.run(`ALTER TABLE ${safeTableName} ADD COLUMN ${safeColumnName} ${definition};`, (e) => {
          if (e) console.error('Database migration error:', e);
        });
      }
    });
  }

  addColumnIfMissing('profiles', 'user_id', 'INTEGER DEFAULT 0');
  addColumnIfMissing('profiles', 'image_path', 'TEXT');
  addColumnIfMissing('profiles', 'looking_for', 'TEXT');
  addColumnIfMissing('profiles', 'experience_level', 'TEXT');
  addColumnIfMissing('profiles', 'timezone', 'TEXT');
  addColumnIfMissing('profiles', 'bio', 'TEXT');
  addColumnIfMissing('profiles', 'level', 'INTEGER DEFAULT 1');
  addColumnIfMissing('users', 'is_admin', 'INTEGER DEFAULT 0');

  db.get('SELECT COUNT(*) as count FROM profiles;', (err, row) => {
    if (err) {
      console.error('Database initialization error:', err);
      return;
    }
    if (row.count === 0) {
      db.run(`
        INSERT INTO profiles (name, race, class, level, bio, looking_for, experience_level, timezone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        "Astarion",
        "Elf",
        "Rogue",
        5,
        "Charming, dangerous, and absolutely not here to bite… probably.",
        "Romance/RP relationship,Campaign buddies",
        "Expert",
        "UTC-5 (Eastern Time)"
      ]);
    }
  });
});

async function getAllUsers() {
  const rows = await all('SELECT * FROM users ORDER BY user_id DESC;');
  return rows;
}

async function getUsersWithProfiles() {
  const rows = await all(`
    SELECT DISTINCT u.*, p.name as profile_name, p.race, p.class, p.level, p.image_path
    FROM users u
    INNER JOIN profiles p ON u.user_id = p.user_id
    WHERE p.user_id > 0
    ORDER BY u.user_id DESC;
  `);
  return rows;
}

async function getUserByName(name) {
  return await get('SELECT * FROM users WHERE name = ?;', [name]);
}

async function getUserById(user_id) {
  const row = await get('SELECT * FROM users WHERE user_id = ?;', [user_id]);
  return row;
}

async function createUser(name, pass) {
  const result = await run('INSERT INTO users (name, pass) VALUES (?, ?);', [name, pass]);
  return result.lastID;
}

async function updateUser(user_id, name, pass) {
  await run('UPDATE users SET name = ?, pass = ? WHERE user_id = ?;', [name, pass, user_id]);
}

async function deleteUser(user_id) {
  await run('DELETE FROM users WHERE user_id = ?;', [user_id]);
}

async function getAllProfiles() {
  const rows = await all('SELECT * FROM profiles ORDER BY profile_id DESC;');
  return rows;
}

async function getProfileById(profile_id) {
  const row = await get('SELECT * FROM profiles WHERE profile_id = ?;', [profile_id]);
  return row;
}

async function getProfileByUserId(user_id) {
  const row = await get('SELECT * FROM profiles WHERE user_id = ?;', [user_id]);
  return row;
}

async function createProfile(name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, user_id) {
  const result = await run(`
    INSERT INTO profiles (name, race, class, level, bio, image_path, looking_for, experience_level, timezone, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, user_id]);
  return result.lastID;
}

async function updateProfile(profile_id, name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone) {
  await run(`
    UPDATE profiles SET name = ?, race = ?, class = ?, level = ?, bio = ?, image_path = ?, looking_for = ?, experience_level = ?, timezone = ? WHERE profile_id = ?;
  `, [name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, profile_id]);
}

async function deleteProfile(profile_id) {
  await run('DELETE FROM profiles WHERE profile_id = ?;', [profile_id]);
}

module.exports = {
  getAllUsers,
  getUsersWithProfiles,
  getUserById,
  getUserByName,
  createUser,
  updateUser,
  deleteUser,
  getAllProfiles,
  getProfileById,
  getProfileByUserId,
  createProfile,
  updateProfile,
  deleteProfile
};
