var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const db = require("../Database");
const rateLimit = require("express-rate-limit");
const { log } = require("../logger");

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
  max: 10, // limit each IP to 10 registration attempts
  message: "Too many registration attempts. Try again later.",
  handler: (req, res) => {
    log(`REGISTER: Rate limit exceeded - IP: ${req.ip}`);
    res.status(429).render("register", { error: "Too many registration attempts. Try again later." });
  }
});


// Home
router.get('/', function(req, res, next) {
  const websiteName = "D&D Dating!";
  res.render('index', { websiteName });
});

// Register
router.get("/register", (req, res) => {
  res.render("register", { error: null });
});

router.post("/register", registerLimiter, async (req, res) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";
  const pass2 = req.body.pass2 || "";

  if (!name || !pass) return res.status(400).render("register", { error: "Missing username or password" });
  // Modern NIST guidelines: allow all characters including unicode and whitespace
  // Minimum 12 characters, OWASP recommendation!, no composition rules
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
    await db.createUser(name, hash);
    log(`REGISTER: Success - New user created: ${name}`);

    return res.redirect("/login");
  } catch (err) {
    return res.status(500).render("register", { error: err.message });
  }
});

// Login
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", loginLimiter, async (req, res) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";

  try {
    const user = await db.getUserByName(name);
    if (!user) {
      log(`LOGIN: Failed - User not found: ${name}, IP: ${req.ip}`);
      return res.status(401).render("login", { error: "Invalid username or password" });
    }

    const ok = await bcrypt.compare(pass, user.pass);
    if (!ok) {
      log(`LOGIN: Failed - Wrong password for user: ${name}, IP: ${req.ip}`);
      return res.status(401).render("login", { error: "Invalid username or password" });
    }

    req.session.regenerate((err) => {
      if (err) {
        log(`LOGIN: Error - Session regeneration failed for user: ${name}`);
        return res.status(500).render("login", { error: "Session error" });
      }

      req.session.user = { user_id: user.user_id, name: user.name, is_admin: user.is_admin };
      log(`LOGIN: Success - User logged in: ${name}, IP: ${req.ip}`);

      let redirectTo = req.session.returnTo || "/";
      delete req.session.returnTo;

      if (!redirectTo.startsWith("/")) redirectTo = "/";

      return res.redirect(redirectTo);
    });

  } catch (err) {
    return res.status(500).render("login", { error: err.message });
  }
});


// Logout (POST)
router.post("/logout", (req, res) => {
  const userName = req.session?.user?.name || "Unknown";
  log(`LOGOUT: User logged out: ${userName}`);
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
