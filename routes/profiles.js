var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    const files = fs.readdirSync(uploadDir);
    
    for (const existingFile of files) {
      const existingFilePath = path.join(uploadDir, existingFile);
      try {
        const existingBuffer = fs.readFileSync(existingFilePath);
        const newBuffer = fs.readFileSync(file.path);
        
        if (Buffer.compare(existingBuffer, newBuffer) === 0) {
          fs.unlinkSync(file.path);
          return cb(null, existingFile);
        }
      } catch (err) {
        continue;
      }
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Expert"];

const TIMEZONES = [
  "UTC-12 (Baker Island)",
  "UTC-11 (American Samoa)",
  "UTC-10 (Hawaii)",
  "UTC-9 (Alaska)",
  "UTC-8 (Pacific Time)",
  "UTC-7 (Mountain Time)",
  "UTC-6 (Central Time)",
  "UTC-5 (Eastern Time)",
  "UTC-4 (Atlantic Time)",
  "UTC-3 (South America)",
  "UTC-2 (Mid-Atlantic)",
  "UTC-1 (Azores)",
  "UTC+0 (GMT)",
  "UTC+1 (Central Europe)",
  "UTC+2 (Eastern Europe)",
  "UTC+3 (Moscow)",
  "UTC+4 (Dubai)",
  "UTC+5 (Karachi)",
  "UTC+5:30 (India)",
  "UTC+6 (Bangladesh)",
  "UTC+7 (Bangkok)",
  "UTC+8 (China/Singapore)",
  "UTC+9 (Japan/Korea)",
  "UTC+10 (Australia)",
  "UTC+11 (Solomon Islands)",
  "UTC+12 (New Zealand)"
];

function getUserId(req) {
  return parseInt(req.cookies.user_id) || 1; 
}

router.get('/all', (req, res) => {
  db.getAllProfiles((err, profiles) => {
    if (err) return res.status(500).send(err.message);
    res.render('allProfiles', {
      profiles,
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
    });
  });
});

router.get('/my', (req, res) => {
  const user_id = getUserId(req);
  
  db.getProfileByUserId(user_id, (err, profile) => {
    if (err) return res.status(500).send(err.message);
    
    if (profile) {
      const lookingForArray = profile.looking_for ? profile.looking_for.split(',') : [];
      res.render('myProfile', {
        profile,
        classes: DND_CLASSES,
        races: DND_RACES,
        experienceLevels: EXPERIENCE_LEVELS,
        timezones: TIMEZONES,
        lookingForArray,
        hasProfile: true,
      });
    } else {
      res.render('myProfile', {
        profile: null,
        classes: DND_CLASSES,
        races: DND_RACES,
        experienceLevels: EXPERIENCE_LEVELS,
        timezones: TIMEZONES,
        lookingForArray: [],
        hasProfile: false,
      });
    }
  });
});

router.post('/my', upload.single('image'), (req, res) => {
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  const user_id = getUserId(req);

  db.createProfile(name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone, user_id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles/my");
  });
});

router.post('/my/update', upload.single('image'), (req, res) => {
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone, profile_id } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;

  db.updateProfile(profile_id, name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles/my");
  });
});

router.post('/my/delete', (req, res) => {
  const user_id = getUserId(req);
  
  db.getProfileByUserId(user_id, (err, profile) => {
    if (err) return res.status(500).send(err.message);
    if (profile && profile.image_path) {
      const imagePath = path.join(__dirname, '..', profile.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    db.deleteProfile(profile.profile_id, (err) => {
      if (err) return res.status(500).send(err.message);
      res.redirect('/profiles/my');
    });
  });
});

router.get('/', (req, res) => {
  res.redirect('/profiles/my');
});

router.get('/:id/edit', (req, res) => {
  db.getProfileById(req.params.id, (err, profile) => {
    if (err) return res.status(500).send(err.message);
    if (!profile) return res.status(404).send("Profile not found");
    
  
    const lookingForArray = profile.looking_for ? profile.looking_for.split(',') : [];
    
    res.render('editProfile', {
      profile,
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
      lookingForArray,
    });
  });
});

router.post('/:id', upload.single('image'), (req, res) => {
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;

  db.updateProfile(req.params.id, name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect("/profiles/my");
  });
});

router.post('/:id/delete', (req, res) => {
  db.getProfileById(req.params.id, (err, profile) => {
    if (err) return res.status(500).send(err.message);
    if (profile && profile.image_path) {
      const imagePath = path.join(__dirname, '..', profile.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    db.deleteProfile(req.params.id, (err) => {
      if (err) return res.status(500).send(err.message);
      res.redirect('/profiles/my');
    });
  });
});

module.exports = router;
