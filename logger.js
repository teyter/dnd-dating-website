const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "app.log");
const securityLogPath = path.join(__dirname, "security.log");

// Sanitize user input to prevent log injection attacks (CWE-117)
function sanitizeForLog(input) {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str.replace(/[\r\n]/g, '_');
}

// Here we are implementing a simple logging mechanism. T
// This is for when we want to log important events like errors or security events.
function log(message) {
  const sanitized = sanitizeForLog(message);
  const line = `[${new Date().toISOString()}] ${sanitized}\n`;
  fs.appendFile(logPath, line, (err) => {
    if (err) console.error("Failed to write log:", err.message);
  });
}

// Security-focused logging, follows OWASP Logging Vocabulary
// Format: event_name:param1,param2 or event_name[{param1,param2}]
function securityLog(event, details) {
  let detailsStr;
  if (typeof details === 'object' && details !== null) {
    // Convert object to OWASP format: {key1,key2,key3}
    const keys = Object.keys(details);
    detailsStr = `[${keys.join(',')}]`;
    // Add actual values (sanitized)
    const values = Object.values(details).map(v => sanitizeForLog(v === undefined ? 'undefined' : v));
    detailsStr += ` {${values.join(',')}}`;
  } else {
    detailsStr = sanitizeForLog(details);
  }
  const line = `[${new Date().toISOString()}] [${sanitizeForLog(event)}] ${detailsStr}\n`;
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
