const express = require('express');
const app = express();
const port = 3000;
const os = require("os");
const fs = require("fs");
const { execFile } = require("child_process");
const { log, logPath } = require("./logger");

const db = require('./Database');

const DND_CLASSES = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const DND_RACES = [
  "Dragonborn",
  "Dwarf",
  "Elf",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Halfling",
  "Human",
  "Tiefling",
];

app.locals.classes = DND_CLASSES;
app.locals.races = DND_RACES;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Manually formatting
app.get('/viewUsers', (req, res) => {
  const user = { name: 'Bob', pass: 'password123' };
  const htmlOut = `<html><body><h2>Users</h2>
    <table>
      <tr><th>Username</th><th>Password</th></tr>
      <tr><td>${user.name}</td><td>${user.pass}</td></tr>
    </table>
  </body></html>`;
  res.send(htmlOut);
});

// Templating and passing variables using ejs
app.get('/', (req, res) => {
  const websiteName = "D&D Dating!";
  res.render('index', { websiteName });
});

// Templates and control flow
app.get('/viewUsersTemplate', (req, res) => {
  const users = [
    { name: 'bob', pass: 'password123' },
    { name: 'alice', pass: '12345' },
  ];
  res.render('viewUsers', { users });
});

// View users from SQLite
app.get('/users', (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) return res.status(500).send(err.message);
    res.render('users', { users });
  });
});

// Create user
app.post('/users', (req, res) => {
  const { name, pass } = req.body;

  db.createUser(name, pass, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/users');
  });
});

// Delete user
app.post('/users/:id/delete', (req, res) => {
  db.deleteUser(req.params.id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/users');
  });
});

// Edit user
app.get("/users/:id/edit", (req, res) => {
  db.getUserById(req.params.id, (err, user) => {
    if (err) return res.status(500).send(err.message);
    if (!user) return res.status(404).send("User not found");
    res.render("editUser", { user });
  });
});

// Update user (save edit form)
app.post("/users/:id", (req, res) => {
  const { name, pass } = req.body;

  db.updateUser(req.params.id, name, pass, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/users");
  });
});

app.use('/admin', (req, res, next) => {
  const auth = req.headers.authorization || '';
  const [type, encoded] = auth.split(' ');

  if (type !== 'Basic' || !encoded) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Authentication required');
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  // change these
  if (user === 'admin' && pass === 'admin') return next();

  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Invalid credentials');
});

// read the last N lines of a file
function readLastLines(filePath, maxLines = 200) {
  try {
    if (!fs.existsSync(filePath)) return "";
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split("\n");
    return lines.slice(-maxLines).join("\n");
  } catch (e) {
    return `Error reading log: ${e.message}`;
  }
}

// Admin page
app.get("/admin", (req, res) => {
  // Log view (read)
  const logTail = readLastLines(logPath, 200);

  // App/server stats (no shell)
  const appUptimeSeconds = process.uptime();
  const systemUptimeSeconds = os.uptime();
  const memory = process.memoryUsage();

  // Shell command (dynamic query) — safe: execFile with fixed command + args
  execFile("uptime", [], { timeout: 1500 }, (err, stdout, stderr) => {
    const uptimeOut = err
      ? `Error running uptime: ${err.message}`
      : (stdout || stderr || "").trim();

    res.render("admin", {
      uptimeOut,
      appUptimeSeconds,
      systemUptimeSeconds,
      memory,
      logTail,
    });
  });
});

// Write to log file
app.post("/admin/log", (req, res) => {
  const msg = (req.body.message || "").trim();
  if (msg.length > 0) log(`ADMIN_NOTE: ${msg}`);
  res.redirect("/admin");
});

// View profiles
app.get("/profiles", (req, res) => {
  db.getAllProfiles((err, profiles) => {
    if (err) return res.status(500).send(err.message);
    res.render("profiles", {
      profiles,
      classes: DND_CLASSES,
    });
  });
});

// Create profile
app.post("/profiles", (req, res) => {
  const { name, race, class: clazz, level, bio } = req.body;

  db.createProfile(name, race, clazz, Number(level), bio, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles");
  });
});

// Edit profile form
app.get("/profiles/:id/edit", (req, res) => {
  db.getProfileById(req.params.id, (err, profile) => {
    if (err) return res.status(500).send(err.message);
    if (!profile) return res.status(404).send("Profile not found");
    res.render("editProfile", {
      profile,
      classes: DND_CLASSES,
    });
  });
});

// Update profile
app.post("/profiles/:id", (req, res) => {
  const { name, race, class: clazz, level, bio } = req.body;

  db.updateProfile(req.params.id, name, race, clazz, Number(level), bio, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles");
  });
});

// Delete profile
app.post("/profiles/:id/delete", (req, res) => {
  db.deleteProfile(req.params.id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles");
  });
});

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
