const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "app.log");

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(logPath, line, (err) => {
    if (err) console.error("Failed to write log:", err.message);
  });
}

module.exports = { log, logPath };
