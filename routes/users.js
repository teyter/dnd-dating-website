var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();

const db = require('../Database');
const bcrypt = require('bcrypt');
const { securityLog, getClientIp } = require('../logger');
const { requirePermission, PERMISSIONS } = require('../middleware/auth');

// here we are applying the requirePermission middleware, so only users with VIEW_ALL_USERS permission can access any user management features, admins can view all users.
router.use(requirePermission(PERMISSIONS.VIEW_ALL_USERS));

function readLastLines(filePath, maxLines = 200) {
  const fs = require('fs');
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

// View all users
router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.render("viewUsers", { users, csrfToken: req.session.csrfToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Create new user, admin only as it require CREATE_USER permission
router.get('/new', requirePermission(PERMISSIONS.CREATE_USER), async (req, res) => {
  try {
    res.render("createUser", { csrfToken: req.session.csrfToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Handle to create new user
router.post('/new', upload.none(), async (req, res) => {
  const { name, pass, userType } = req.body;

  try {
    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(pass, 10);
    await db.createUser(name, hashedPassword, userType || 'player');
    securityLog('USER_CREATED', `Admin created user: ${name}`);
    res.redirect("/users");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.render("editUser", { user, csrfToken: req.session.csrfToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/:id', upload.none(), async (req, res) => {
  const { name, pass } = req.body;

  try {
    // If password is empty, keep the current password
    if (!pass || pass.trim() === '') {
      const user = await db.getUserById(req.params.id);
      await db.updateUser(req.params.id, name, user.pass);
    } else {
      // Hash the password before saving it.
      const hashedPassword = await bcrypt.hash(pass, 10);
      await db.updateUser(req.params.id, name, hashedPassword);
    }
    securityLog('USER_UPDATED', `Admin updated user ID: ${req.params.id}`);
    res.redirect("/users");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/:id/delete', upload.none(), async (req, res) => {
  try {
    await db.deleteUser(req.params.id);
    securityLog('USER_DELETED', `Admin deleted user ID: ${req.params.id}`);
    res.redirect('/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
