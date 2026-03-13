var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const db = require("../Database");
const rateLimit = require("express-rate-limit");
const { log, securityLog, getClientIp } = require("../logger");

// Admin username is now an environment variable (not hardcoded)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'TheBoss';

// Helper function to normalize username for comparison, to prevent homograph attacks
function normalizeUsername(username) {
  // Convert to ASCII equivalents and remove diacritics
  return username
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0400-\u04FF]/g, '') // Cyrillic
    .replace(/[\u0370-\u03FF]/g, '') // Greek
    .replace(/[\u0400-\u04FF]/g, '') // Cyrillic extended
    .toLowerCase();
}

// Check if username is the admin (configured via environment variable)
function isAdminUser(username) {
  const normalized = normalizeUsername(username);
  const adminNormalized = normalizeUsername(ADMIN_USERNAME);
  
  // Block exact match and visually similar usernames
  return normalized === adminNormalized || 
         normalized.includes(ADMIN_USERNAME.toLowerCase()) ||
         username.toLowerCase().includes(ADMIN_USERNAME.toLowerCase());
}

// Reserved usernames that could confuse users or impersonate privileged accounts
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'root', 'moderator', 'sysadmin',
  'theboss', 'superuser', 'super admin', 'owner', 'webmaster'
];

// Checks if username is reserved, to prevent impersonation of admin, privileged roles
function isReservedUsername(username) {
  const normalized = normalizeUsername(username);
  return RESERVED_USERNAMES.some(reserved => 
    normalized === reserved || 
    normalized.includes(reserved)
  );
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts
  message: "Too many login attempts. Try again later.",
  handler: (req, res) => {
    log(`AUTH: Rate limit exceeded - IP: ${req.ip}`);
    res.status(429).render("login", { error: "Too many login attempts. Try again later." });
  }
});

// Registration rate limiter, to prevent username enumeration
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 registration attempts
  message: "Too many registration attempts. Try again later.",
  handler: (req, res) => {
    log(`REGISTER: Rate limit exceeded - IP: ${req.ip}`);
    res.status(429).render("register", { error: "Too many registration attempts. Try again later." });
  }
});

router.get('/', function(req, res, next) {
  const websiteName = "D&D Dating!";
  res.render('index', { websiteName });
});

router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.post("/register", registerLimiter, async (req, res, next) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";
  const pass2 = req.body.pass2 || "";

  if (!name || !pass) return res.status(400).render("register", { error: "Missing username or password" });
  
  // Block usernames that impersonate the admin
  if (isAdminUser(name)) {
    return res.status(400).render("register", { error: "Username not available" });
  }
  
  // Block reserved usernames that could impersonate admin/privileged roles
  if (isReservedUsername(name)) {
    return res.status(400).render("register", { error: "Username not available" });
  }
  
  // we follow NIST guidelines: allow all characters including unicode and whitespace
  // Minimum 12 characters, OWASP recommendation!, no composition rules, meaning that passphrase style passwords are allowed and encouraged, 
  // which are more resistant to brute force attacks
  if (pass.length < 12) {
    return res.status(400).render("register", { 
      error: "Password must be at least 12 characters" 
    });
  }

  if (pass !== pass2) return res.status(400).render("register", { error: "Passwords do not match" });

  try {
    const existing = await db.getUserByName(name);
    if (existing) {
      log(`REGISTER: Failed - Username already taken: ${name}`);
      return res.status(400).render("register", { error: "Username already taken" });
    }

    const hash = await bcrypt.hash(pass, 12);
    // All new users start as 'player', can be changed in profile with edit
    await db.createUser(name, hash, 'player');
    log(`REGISTER: Success - New user created: ${name}`);

    return res.redirect("/login");
  } catch (err) {
    next(err);
  }
});

// Login
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", loginLimiter, async (req, res, next) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";

  try {
    const user = await db.getUserByName(name);
    if (!user) {
      securityLog('FAILED_LOGIN', `User not found: ${name} from IP: ${getClientIp(req)}`);
      log(`LOGIN: Failed - User not found: ${name}, IP: ${req.ip}`);
      return res.status(401).render("login", { error: "Invalid username or password" });
    }

    log(`LOGIN: Found user: ${name}, password in DB: ${user.pass ? 'exists' : 'missing'}`);
    const ok = await bcrypt.compare(pass, user.pass);
    if (!ok) {
      securityLog('FAILED_LOGIN', `Wrong password for user: ${name} from IP: ${getClientIp(req)}`);
      log(`LOGIN: Failed - Wrong password for user: ${name}, IP: ${req.ip}`);
      return res.status(401).render("login", { error: "Invalid username or password" });
    }

    req.session.regenerate((err) => {
      if (err) {
        log(`LOGIN: Error - Session regeneration failed for user: ${name}`);
        return res.status(500).render("login", { error: "Session error" });
      }

      // Admin determined by environment variable, it is not hardcoded anylonger, and visually similar usernames are blocked in registration.
      const is_admin = isAdminUser(user.name) ? 1 : 0;
      req.session.user = { user_id: user.user_id, name: user.name, is_admin, user_type: user.user_type };
      securityLog('SUCCESSFUL_LOGIN', `User: ${name} logged in from IP: ${getClientIp(req)}`);
      log(`LOGIN: Success - User logged in: ${name}, IP: ${req.ip}`);

      let redirectTo = req.session.returnTo || "/";
      delete req.session.returnTo;

      if (!redirectTo.startsWith("/")) redirectTo = "/";

      return res.redirect(redirectTo);
    });

  } catch (err) {
    log(`LOGIN: Error - ${err.message}, stack: ${err.stack}`);
    next(err);
  }
});

// Logout (POST)
router.post("/logout", (req, res) => {
  const userName = req.session?.user?.name || "Unknown";
  securityLog('LOGOUT', `User: ${userName} logged out from IP: ${getClientIp(req)}`);
  log(`LOGOUT: User logged out: ${userName}`);
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
