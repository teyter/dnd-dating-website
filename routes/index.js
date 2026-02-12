var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const db = require("../Database");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts
  message: "Too many login attempts. Try again later."
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

router.post("/register", async (req, res) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";
  const pass2 = req.body.pass2 || "";

  if (!name || !pass) return res.status(400).render("register", { error: "Missing username or password" });
  if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
  return res.status(400).render("register", { 
    error: "Password must be at least 8 characters and include one uppercase letter and one number" 
  });
}

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
      return res.status(401).render("login", { error: "Invalid username or password" });
    }

    const ok = await bcrypt.compare(pass, user.pass);
    if (!ok) {
      return res.status(401).render("login", { error: "Invalid username or password" });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).render("login", { error: "Session error" });
      }

      req.session.user = { user_id: user.user_id, name: user.name };

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
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
