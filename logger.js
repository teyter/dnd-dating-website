const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "app.log");
const securityLogPath = path.join(__dirname, "security.log");

// Here we are implementing a simple logging mechanism. T
// This is for when we want to log important events like errors or security events.
function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(logPath, line, (err) => {
    if (err) console.error("Failed to write log:", err.message);
  });
}

// Security-focused logging, for example when we want to log failed logins or access denied
function securityLog(event, details) {
  const line = `[${new Date().toISOString()}] [${event}] ${details}\n`;
  fs.appendFile(securityLogPath, line, (err) => {
    if (err) console.error("Failed to write security log:", err.message);
  });
}

// Here we read lines of the log file, which we display in the admin dashboard. 
//  We also trim leading whitespace for cleaner display. 
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.ip || 
         'unknown';
}

module.exports = { log, logPath, securityLog, getClientIp };
