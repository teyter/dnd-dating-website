var express = require('express');
var router = express.Router();

const os = require("os");
const fs = require("fs");
const { execFile } = require("child_process");
const { log, logPath } = require("../logger");
const db = require("../Database");

// Basic auth middleware for admin routes
router.use('/', (req, res, next) => {
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
    const lines = text.split(/\r?\n/);
    // Get last N lines and remove ALL leading whitespace from each line
    const cleanedLines = lines.slice(-maxLines).map(line => line.replace(/^\s+/, ''));
    return cleanedLines.join('\n');
  } catch (e) {
    return `Error reading log: ${e.message}`;
  }
}

// Admin page
router.get("/", (req, res) => {
  // Get user and profile counts from database
  db.getAllUsers((err, users) => {
    if (err) users = [];
    db.getAllProfiles((err, profiles) => {
      if (err) profiles = [];
      
      const totalUsers = users.length;
      const totalProfiles = profiles.length;
      
      // Log view (read)
      const logTail = readLastLines(logPath, 200);

      // App/server stats (no shell)
      const appUptimeSeconds = process.uptime();
      const systemUptimeSeconds = os.uptime();
      const memory = process.memoryUsage();

      // Shell command (dynamic query) — safe: execFile with fixed command + args
      // Use appropriate command based on OS
      const isWindows = os.platform() === 'win32';
      const uptimeCmd = isWindows ? 'net stats SRV' : 'uptime';
      const uptimeArgs = isWindows ? [] : [];
      
      execFile(uptimeCmd, uptimeArgs, { timeout: 1500 }, (err, stdout, stderr) => {
        let uptimeOut;
        if (err) {
          // Fallback to os.uptime() if command fails
          uptimeOut = `OS Uptime: ${Math.round(os.uptime() / 60)} minutes`;
        } else {
          uptimeOut = isWindows ? stdout : (stdout || stderr || "").trim();
        }

        res.render("admin", {
          uptimeOut,
          appUptimeSeconds,
          systemUptimeSeconds,
          memory,
          logTail,
          totalUsers,
          totalProfiles,
        });
      });
    });
  });
});

// Write to log file
router.post("/log", (req, res) => {
  const msg = (req.body.message || "").trim();
  if (msg.length > 0) log(`ADMIN_NOTE: ${msg}`);
  res.redirect("/admin");
});

module.exports = router;
