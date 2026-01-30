const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pass TEXT NOT NULL
    );
  `);

  // NEW: profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      race TEXT NOT NULL,
      class TEXT NOT NULL,
      level INTEGER NOT NULL,
      bio TEXT
    );
  `);

  // Seed Astarion once
  db.get(`SELECT COUNT(*) AS count FROM profiles;`, [], (err, row) => {
    if (err) return;
    if (row.count === 0) {
      db.run(
        `INSERT INTO profiles (name, race, class, level, bio)
         VALUES (?, ?, ?, ?, ?);`,
        [
          "Astarion",
          "Elf",
          "Rogue",
          5,
          "Charming, dangerous, and absolutely not here to bite… probably.",
        ]
      );
    }
  });
});

function getAllUsers(cb) {
  db.all('SELECT * FROM users ORDER BY user_id DESC;', [], cb);
}

function getUserById(user_id, cb) {
  db.get('SELECT * FROM users WHERE user_id = ?;', [user_id], cb);
}

function createUser(name, pass, cb) {
  db.run('INSERT INTO users (name, pass) VALUES (?, ?);', [name, pass], cb);
}

function updateUser(user_id, name, pass, cb) {
  db.run('UPDATE users SET name = ?, pass = ? WHERE user_id = ?;', [name, pass, user_id], cb);
}

function deleteUser(user_id, cb) {
  db.run('DELETE FROM users WHERE user_id = ?;', [user_id], cb);
}

function getAllProfiles(cb) {
  db.all("SELECT * FROM profiles ORDER BY profile_id DESC;", [], cb);
}

function getProfileById(profile_id, cb) {
  db.get("SELECT * FROM profiles WHERE profile_id = ?;", [profile_id], cb);
}

function createProfile(name, race, clazz, level, bio, cb) {
  db.run(
    "INSERT INTO profiles (name, race, class, level, bio) VALUES (?, ?, ?, ?, ?);",
    [name, race, clazz, level, bio],
    cb
  );
}

function updateProfile(profile_id, name, race, clazz, level, bio, cb) {
  db.run(
    "UPDATE profiles SET name = ?, race = ?, class = ?, level = ?, bio = ? WHERE profile_id = ?;",
    [name, race, clazz, level, bio, profile_id],
    cb
  );
}

function deleteProfile(profile_id, cb) {
  db.run("DELETE FROM profiles WHERE profile_id = ?;", [profile_id], cb);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
