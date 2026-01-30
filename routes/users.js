var express = require('express');
var router = express.Router();

const db = require('../Database');

// View users from SQLite
router.get('/', (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) return res.status(500).send(err.message);
    res.render('users', { users });
  });
});

// Create user
router.post('/', (req, res) => {
  const { name, pass } = req.body;

  db.createUser(name, pass, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/users');
  });
});

// Edit user form
router.get('/:id/edit', (req, res) => {
  db.getUserById(req.params.id, (err, user) => {
    if (err) return res.status(500).send(err.message);
    if (!user) return res.status(404).send("User not found");
    res.render("editUser", { user });
  });
});

// Update user (save edit form)
router.post('/:id', (req, res) => {
  const { name, pass } = req.body;

  db.updateUser(req.params.id, name, pass, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/users");
  });
});

// Delete user
router.post('/:id/delete', (req, res) => {
  db.deleteUser(req.params.id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/users');
  });
});

module.exports = router;
