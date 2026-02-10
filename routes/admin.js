var express = require('express');
var router = express.Router();

const os = require("os");
const fs = require("fs");
const { execFile } = require("child_process");
const { log, logPath } = require("../logger");
const db = require("../Database");

router.use('/', (req, res, next) => {
  const auth = req.headers.authorization || '';
  const [type, encoded] = auth.split(' ');

  if (type !== 'Basic' || !encoded) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Authentication required');
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  if (user === (process.env.ADMIN_USER || 'TheBoss') && pass === (process.env.ADMIN_PASS || 'Hacker1')) return next();

  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).send('Invalid credentials');
});

function readLastLines(filePath, maxLines = 200) {
  try {
    if (!fs.existsSync(filePath)) return "";
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/);
    const cleanedLines = lines.slice(-maxLines).map(line => line.replace(/^\s+/, ''));
    return cleanedLines.join('\n');
  } catch (e) {
    return `Error reading log: ${e.message}`;
  }
}

router.get("/", async (req, res) => {
  let users = [];
  let profiles = [];
  
  try {
    users = await db.getAllUsers();
  } catch (err) {
    users = [];
  }
  
  try {
    profiles = await db.getAllProfiles();
  } catch (err) {
    profiles = [];
  }
  
  const totalUsers = users.length;
  const totalProfiles = profiles.length;
  const logTail = readLastLines(logPath, 200);
  
  const appUptimeSeconds = process.uptime();
  const systemUptimeSeconds = os.uptime();
  const memory = process.memoryUsage();

  const isWindows = os.platform() === 'win32';
  const uptimeCmd = isWindows ? 'net stats SRV' : 'uptime';
  const uptimeArgs = isWindows ? [] : [];
  
  execFile(uptimeCmd, uptimeArgs, { timeout: 1500 }, (err, stdout, stderr) => {
    let uptimeOut;
    if (err) {
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

router.post("/log", (req, res) => {
  const msg = (req.body.message || "").trim();
  if (msg.length > 0) log(`ADMIN_NOTE: ${msg}`);
  res.redirect("/admin");
});

module.exports = router;
