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

  const migrations = [
    "ALTER TABLE profiles ADD COLUMN user_id INTEGER DEFAULT 0;",
    "ALTER TABLE profiles ADD COLUMN image_path TEXT;",
    "ALTER TABLE profiles ADD COLUMN looking_for TEXT;",
    "ALTER TABLE profiles ADD COLUMN experience_level TEXT;",
    "ALTER TABLE profiles ADD COLUMN timezone TEXT;",
    "ALTER TABLE profiles ADD COLUMN bio TEXT;",
    "ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;",
  ];
  
  migrations.forEach(sql => {
    db.run(sql, (err) => {
    });
  });

  db.get(`SELECT COUNT(*) AS count FROM profiles;`, [], (err, row) => {
    if (err) return;
    if (row.count === 0) {
      db.run(
        `INSERT INTO profiles (name, race, class, level, bio, looking_for, experience_level, timezone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          "Astarion",
          "Elf",
          "Rogue",
          5,
          "Charming, dangerous, and absolutely not here to bite… probably.",
          "Romance/RP relationship,Campaign buddies",
          "Expert",
          "UTC-5 (Eastern Time)",
        ]
      );
    }
  });
});

function getAllUsers(cb) {
  db.all('SELECT * FROM users ORDER BY user_id DESC;', [], cb);
}

function getUsersWithProfiles(cb) {
  db.all(`
    SELECT DISTINCT u.*, p.name as profile_name, p.race, p.class, p.level, p.image_path
    FROM users u
    INNER JOIN profiles p ON u.user_id = p.user_id
    WHERE p.user_id > 0
    ORDER BY u.user_id DESC;
  `, [], cb);
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

function getProfileByUserId(user_id, cb) {
  db.get("SELECT * FROM profiles WHERE user_id = ?;", [user_id], cb);
}

function createProfile(name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, user_id, cb) {
  db.run(
    "INSERT INTO profiles (name, race, class, level, bio, image_path, looking_for, experience_level, timezone, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
    [name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, user_id],
    cb
  );
}

function updateProfile(profile_id, name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, cb) {
  db.run(
    "UPDATE profiles SET name = ?, race = ?, class = ?, level = ?, bio = ?, image_path = ?, looking_for = ?, experience_level = ?, timezone = ? WHERE profile_id = ?;",
    [name, race, clazz, level, bio, imagePath, lookingFor, experienceLevel, timezone, profile_id],
    cb
  );
}

function deleteProfile(profile_id, cb) {
  db.run("DELETE FROM profiles WHERE profile_id = ?;", [profile_id], cb);
}

module.exports = {
  getAllUsers,
  getUsersWithProfiles,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllProfiles,
  getProfileById,
  getProfileByUserId,
  createProfile,
  updateProfile,
  deleteProfile,
};
