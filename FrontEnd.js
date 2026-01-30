const express = require('express');
const app = express();
const port = 3000;
const os = require("os");
const fs = require("fs");
const { execFile } = require("child_process");
const { log, logPath } = require("./logger");

const db = require('./Database');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// 2 - Manually formatting (demo)
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

// 3 - Templating and passing variables using ejs (demo)
app.get('/', (req, res) => {
  const websiteName = "D&D Dating!";
  res.render('index', { websiteName });
});

// 4 - Templates and control flow (demo)
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

// Write to log file (dynamic action)
app.post("/admin/log", (req, res) => {
  const msg = (req.body.message || "").trim();
  if (msg.length > 0) log(`ADMIN_NOTE: ${msg}`);
  res.redirect("/admin");
});


app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
