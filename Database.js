const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

// Here we are enabling foreign key constraints for SQLite, which is important for maintaining data integrity between tables like users and profiles.
// this means that if a user is deleted, their profile will also be automatically deleted, and we won't have orphaned profiles without corresponding users.
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
  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      pass TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      user_type TEXT DEFAULT 'player'
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

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS message_requests (
      request_id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Here we create the page_views table, where data like page name, user id, if an user is logged in and timestamp are stored.
  db.run(`
    CREATE TABLE IF NOT EXISTS page_views (
      view_id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL,
      user_id INTEGER,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  addColumnIfMissing('users', 'user_type', 'TEXT DEFAULT "player"');

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

async function createUser(name, pass, userType = 'player') {
  const result = await run('INSERT INTO users (name, pass, user_type) VALUES (?, ?, ?);', [name, pass, userType]);
  return result.lastID;
}

async function updateUser(user_id, name, pass) {
  await run('UPDATE users SET name = ?, pass = ? WHERE user_id = ?;', [name, pass, user_id]);
}

async function updateUserType(user_id, userType) {
  console.log('DB - updateUserType called with:', user_id, userType);
  const validTypes = ['player', 'dm', 'both'];
  if (!validTypes.includes(userType)) {
    throw new Error('Invalid user type');
  }
  await run('UPDATE users SET user_type = ? WHERE user_id = ?;', [userType, user_id]);
  console.log('DB - user_type updated successfully');
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

// Message functions
async function createMessage(senderId, receiverId, content) {
  const result = await run(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?);',
    [senderId, receiverId, content]
  );
  return result.lastID;
}

async function getConversation(userId1, userId2) {
  const rows = await all(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC;
  `, [userId1, userId2, userId2, userId1]);
  return rows;
}

async function getConversations(userId) {
  // get conversations from messages
  const messageConvs = await all(`
    SELECT DISTINCT 
      CASE 
        WHEN sender_id = ? THEN receiver_id 
        ELSE sender_id 
      END as other_user_id,
      (SELECT content FROM messages 
       WHERE (sender_id = ? AND receiver_id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END)
       OR (sender_id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AND receiver_id = ?)
       ORDER BY timestamp DESC LIMIT 1) as last_message,
      (SELECT timestamp FROM messages 
       WHERE (sender_id = ? AND receiver_id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END)
       OR (sender_id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AND receiver_id = ?)
       ORDER BY timestamp DESC LIMIT 1) as last_timestamp
    FROM messages
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY last_timestamp DESC;
  `, [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]);
  
  // Get connections from accepted requests that don't have messages yet
  const requestConvs = await all(`
    SELECT 
      CASE 
        WHEN from_user_id = ? THEN to_user_id 
        ELSE from_user_id 
      END as other_user_id,
      NULL as last_message,
      NULL as last_timestamp
    FROM message_requests
    WHERE (from_user_id = ? OR to_user_id = ?)
    AND status = 'accepted'
  `, [userId, userId, userId]);
  
  // Filter out requestConvs that already have messages, to avoid duplicates.
  const userIdsWithMessages = new Set(messageConvs.map(c => c.other_user_id));
  const filteredRequestConvs = requestConvs.filter(c => !userIdsWithMessages.has(c.other_user_id));
  
  // Combine and sort by last_timestamp.
  const allConvs = [...messageConvs, ...filteredRequestConvs];
  allConvs.sort((a, b) => {
    if (!a.last_timestamp) return 1;
    if (!b.last_timestamp) return -1;
    return new Date(b.last_timestamp) - new Date(a.last_timestamp);
  });
  
  return allConvs;
}

async function getUnreadCount(userId, otherUserId) {
  const row = await get(`
    SELECT COUNT(*) as count FROM messages 
    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0;
  `, [otherUserId, userId]);
  return row ? row.count : 0;
}

async function markMessagesAsRead(senderId, receiverId) {
  await run(`
    UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?;
  `, [senderId, receiverId]);
}

// Message request functions
async function createMessageRequest(fromUserId, toUserId) {
  // Check if request already exists
  const existing = await get(`
    SELECT * FROM message_requests 
    WHERE from_user_id = ? AND to_user_id = ?
  `, [fromUserId, toUserId]);
  
  if (existing) {
    return { exists: true, request: existing };
  }
  
  const result = await run(
    'INSERT INTO message_requests (from_user_id, to_user_id) VALUES (?, ?);',
    [fromUserId, toUserId]
  );
  return { exists: false, requestId: result.lastID };
}

async function getMessageRequests(userId) {
  const rows = await all(`
    SELECT mr.*, u.name as from_user_name, p.name as from_profile_name, p.image_path as from_profile_image
    FROM message_requests mr
    LEFT JOIN users u ON mr.from_user_id = u.user_id
    LEFT JOIN profiles p ON mr.from_user_id = p.user_id
    WHERE mr.to_user_id = ? AND mr.status = 'pending'
    ORDER BY mr.timestamp DESC;
  `, [userId]);
  return rows;
}

async function acceptMessageRequest(requestId, userId) {
  await run(`
    UPDATE message_requests SET status = 'accepted' WHERE request_id = ? AND to_user_id = ?;
  `, [requestId, userId]);
}

async function declineMessageRequest(requestId, userId) {
  await run(`
    UPDATE message_requests SET status = 'declined' WHERE request_id = ? AND to_user_id = ?;
  `, [requestId, userId]);
}

async function getMessageConnection(userId1, userId2) {
  const row = await get(`
    SELECT * FROM message_requests 
    WHERE ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
    AND status = 'accepted'
  `, [userId1, userId2, userId2, userId1]);
  return row;
}

async function hasMessageConnection(userId1, userId2) {
  const connection = await getMessageConnection(userId1, userId2);
  return connection !== undefined;
}

module.exports = {
  getAllUsers,
  getUsersWithProfiles,
  getUserById,
  getUserByName,
  createUser,
  updateUser,
  updateUserType,
  deleteUser,
  getAllProfiles,
  getProfileById,
  getProfileByUserId,
  createProfile,
  updateProfile,
  deleteProfile,
  createMessage,
  getConversation,
  getConversations,
  getUnreadCount,
  markMessagesAsRead,
  createMessageRequest,
  getMessageRequests,
  acceptMessageRequest,
  declineMessageRequest,
  hasMessageConnection,
  getTotalMessages,
  getTodayMessages,
  getTotalPageViews,
  getTodayPageViews,
  logPageView,
  getTotalActiveUsers,
  getRecentActivity
};

// Analytics functions
async function getTotalMessages() {
  const result = await get('SELECT COUNT(*) as count FROM messages;');
  return result ? result.count : 0;
}

async function getTodayMessages() {
  const today = new Date().toISOString().split('T')[0];
  const result = await get('SELECT COUNT(*) as count FROM messages WHERE DATE(timestamp) = ?;', [today]);
  return result ? result.count : 0;
}

async function getTotalPageViews() {
  const result = await get('SELECT COUNT(*) as count FROM page_views;');
  return result ? result.count : 0;
}

async function getTodayPageViews() {
  const today = new Date().toISOString().split('T')[0];
  const result = await get('SELECT COUNT(*) as count FROM page_views WHERE DATE(viewed_at) = ?;', [today]);
  return result ? result.count : 0;
}

async function logPageView(pageName, userId = null) {
  await run('INSERT INTO page_views (page_name, user_id) VALUES (?, ?);', [pageName, userId]);
}

async function getTotalActiveUsers() {
  const result = await get('SELECT COUNT(DISTINCT user_id) as count FROM page_views WHERE viewed_at > datetime("now", "-24 hours");');
  return result ? result.count : 0;
}

async function getRecentActivity(limit = 20) {
  const rows = await all(`
    SELECT pv.*, u.name as user_name 
    FROM page_views pv 
    LEFT JOIN users u ON pv.user_id = u.user_id 
    ORDER BY pv.viewed_at DESC 
    LIMIT ?;
  `, [limit]);
  return rows;
}
