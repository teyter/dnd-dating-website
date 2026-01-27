const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "users.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pass TEXT NOT NULL
    );
  `);
});

function getAllUsers(cb) {
  db.all("SELECT * FROM users ORDER BY user_id DESC;", [], cb);
}

function getUserById(user_id, cb) {
  db.get("SELECT * FROM users WHERE user_id = ?;", [user_id], cb);
}

function createUser(name, pass, cb) {
  db.run("INSERT INTO users (name, pass) VALUES (?, ?);", [name, pass], cb);
}

function updateUser(user_id, name, pass, cb) {
  db.run(
    "UPDATE users SET name = ?, pass = ? WHERE user_id = ?;",
    [name, pass, user_id],
    cb
  );
}

function deleteUser(user_id, cb) {
  db.run("DELETE FROM users WHERE user_id = ?;", [user_id], cb);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
