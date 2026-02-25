var express = require('express');
var router = express.Router();

const db = require('../Database');

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.is_admin) {
    return res.status(403).render('../views/error', { statusCode: 403 });
  }
  next();
}

// Apply admin check to all users routes
router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.render('users', { users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/', async (req, res) => {
  const { name, pass } = req.body;

  try {
    await db.createUser(name, pass);
    res.redirect('/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.render("editUser", { user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/:id', async (req, res) => {
  const { name, pass } = req.body;

  try {
    await db.updateUser(req.params.id, name, pass);
    res.redirect("/users");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/:id/delete', async (req, res) => {
  try {
    await db.deleteUser(req.params.id);
    res.redirect('/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
