var express = require('express');
var router = express.Router();

const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { log, logPath, securityLog, getClientIp } = require("../logger");
const db = require("../Database");
const { requirePermission, PERMISSIONS } = require('../middleware/auth');

// Security log path, used for admin dashboard to view recent security events.
// we are implementing our own security log instead of using a logging library, to have more control and prevent log injection attacks.
// we have a separate log file for security events, and a separate log file for regular events.
// we secure this by sanitizing all log messages, and by not allowing user input to be logged directly without sanitization.
const securityLogPath = path.join(__dirname, "../security.log");

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

router.get("/", async (req, res, next) => {
  try {
    const users = await db.getAllUsers();
    const profiles = await db.getAllProfiles();
    
    // analytics stats for admin dashboard
    const totalMessages = await db.getTotalMessages();
    const todayMessages = await db.getTodayMessages();
    const totalPageViews = await db.getTotalPageViews();
    const todayPageViews = await db.getTodayPageViews();
    const activeUsers = await db.getTotalActiveUsers();
    const recentActivity = await db.getRecentActivity(30);
    
    const totalUsers = users.length;
    const totalProfiles = profiles.length;
    const logTail = readLastLines(logPath, 200);
    const securityLogTail = readLastLines(securityLogPath, 200);
    
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
        securityLogTail,
        totalUsers,
        totalProfiles,
        totalMessages,
        todayMessages,
        totalPageViews,
        todayPageViews,
        activeUsers,
        recentActivity
      });
    });
  } catch (err) {
    next(err);
  }
});

router.post("/log", (req, res, next) => {
  try {
    const msg = (req.body.message || "").trim();
    if (msg.length > 0) log(`ADMIN_NOTE: ${msg}`);
    res.redirect("/admin");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
