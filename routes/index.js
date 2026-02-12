var express = require('express');
var router = express.Router();

const bcrypt = require("bcrypt");
const db = require("../Database");

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
  if (pass.length < 8) return res.status(400).render("register", { error: "Password must be at least 8 characters" });
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

router.post("/login", async (req, res) => {
  const name = (req.body.name || "").trim();
  const pass = req.body.pass || "";

  try {
    const user = await db.getUserByName(name);
    if (!user) return res.status(401).render("login", { error: "Invalid username or password" });

    const ok = await bcrypt.compare(pass, user.pass);
    if (!ok) return res.status(401).render("login", { error: "Invalid username or password" });

    req.session.user = { user_id: user.user_id, name: user.name };
    return res.redirect("/");
  } catch (err) {
    return res.status(500).render("login", { error: err.message });
  }
});

// Logout (POST)
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
