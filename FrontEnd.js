const express = require('express');
const app = express();
const port = 3000;
const os = require("os");
const fs = require("fs");
const { execFile } = require("child_process");
const { log, logPath } = require("./logger");
const db = require('./Database');
const session = require("express-session");
const bcrypt = require("bcrypt");

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

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true only when using HTTPS, but for local development, like we are doing, we can keep it as false
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; 
  next();
});

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

app.get('/', (req, res) => {
  const websiteName = "D&D Dating!";
  res.render('index', { websiteName });
});

app.get('/viewUsersTemplate', (req, res) => {
  const users = [
    { name: 'bob', pass: 'password123' },
    { name: 'alice', pass: '12345' },
  ];
  res.render('viewUsers', { users });
});

app.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.render('users', { users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/users', async (req, res) => {
  const { name, pass } = req.body;

  try {
    await db.createUser(name, pass);
    res.redirect('/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/users/:id/delete', async (req, res) => {
  try {
    await db.deleteUser(req.params.id);
    res.redirect('/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/users/:id/edit", async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.render("editUser", { user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/users/:id", async (req, res) => {
  const { name, pass } = req.body;

  try {
    await db.updateUser(req.params.id, name, pass);
    res.redirect("/users");
  } catch (err) {
    res.status(500).send(err.message);
  }
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

  if (user === 'admin' && pass === 'admin') return next();

  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Invalid credentials');
});

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

app.get("/admin", (req, res) => {
  const logTail = readLastLines(logPath, 200);

  const appUptimeSeconds = process.uptime();
  const systemUptimeSeconds = os.uptime();
  const memory = process.memoryUsage();

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

app.post("/admin/log", (req, res) => {
  const msg = (req.body.message || "").trim();
  if (msg.length > 0) log(`ADMIN_NOTE: ${msg}`);
  res.redirect("/admin");
});

app.get("/profiles", async (req, res) => {
  try {
    const profiles = await db.getAllProfiles();
    res.render("profiles", {
      profiles,
      classes: DND_CLASSES,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/profiles", async (req, res) => {
  const { name, race, class: clazz, level, bio } = req.body;

  try {
    await db.createProfile(name, race, clazz, Number(level), bio, null, '', '', '', 0);
    res.redirect("/profiles");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/profiles/:id/edit", async (req, res) => {
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) return res.status(404).send("Profile not found");
    res.render("editProfile", {
      profile,
      classes: DND_CLASSES,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/profiles/:id", async (req, res) => {
  const { name, race, class: clazz, level, bio } = req.body;

  try {
    await db.updateProfile(req.params.id, name, race, clazz, Number(level), bio, null, '', '', '');
    res.redirect("/profiles");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/profiles/:id/delete", async (req, res) => {
  try {
    await db.deleteProfile(req.params.id);
    res.redirect("/profiles");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";
  const pass2 = req.body.pass2 || "";

  if (!name || !pass) return res.status(400).render("register", { error: "Missing username or password" });
  if (pass.length < 8) return res.status(400).render("register", { error: "Password must be at least 8 characters" });
  if (pass !== pass2) return res.status(400).render("register", { error: "Passwords do not match" });

  try {
    const existing = await db.getUserByName(name);
    if (existing) return res.status(400).render("register", { error: "Username already taken" });

    const hash = await bcrypt.hash(pass, 12);
    await db.createUser(name, hash);
    return res.redirect("/login");
  } catch (err) {
    return res.status(500).render("register", { error: err.message });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";

  try {
    const user = await db.getUserByName(name);
    if (!user) return res.status(401).render("login", { error: "Invalid username or password" });

    const ok = await bcrypt.compare(pass, user.pass);
    if (!ok) return res.status(401).render("login", { error: "Invalid username or password" });

    req.session.user = { user_id: user.user_id, name: user.name };
    return res.redirect("/");
  } catch (err) {
    return res.status(500).render("login", { error: err.message });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});
app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
