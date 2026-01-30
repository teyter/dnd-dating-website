var express = require('express');
var router = express.Router();

const db = require('../Database');

const DND_CLASSES = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard",
];

const DND_RACES = [
  "Dragonborn", "Dwarf", "Elf", "Gnome", "Half-Elf",
  "Half-Orc", "Halfling", "Human", "Tiefling",
];

// View profiles
router.get('/', (req, res) => {
  db.getAllProfiles((err, profiles) => {
    if (err) return res.status(500).send(err.message);
    res.render('profiles', {
      profiles,
      classes: DND_CLASSES,
      races: DND_RACES,
    });
  });
});

// Create profile
router.post('/', (req, res) => {
  const { name, race, class: clazz, level, bio } = req.body;

  db.createProfile(name, race, clazz, Number(level), bio, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles");
  });
});

// Edit profile form
router.get('/:id/edit', (req, res) => {
  db.getProfileById(req.params.id, (err, profile) => {
    if (err) return res.status(500).send(err.message);
    if (!profile) return res.status(404).send("Profile not found");
    res.render('editProfile', {
      profile,
      classes: DND_CLASSES,
      races: DND_RACES,
    });
  });
});

// Update profile
router.post('/:id', (req, res) => {
  const { name, race, class: clazz, level, bio } = req.body;

  db.updateProfile(req.params.id, name, race, clazz, Number(level), bio, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles");
  });
});

// Delete profile
router.post('/:id/delete', (req, res) => {
  db.deleteProfile(req.params.id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/profiles');
  });
});

module.exports = router;
