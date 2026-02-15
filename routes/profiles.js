var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');

const db = require('../Database');
const { validateCsrf, validateCsrfFromHeader } = require('../middleware/csrf');

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
  // we use session user_id instead of cookie. This is more secure because cookies can be manipulated.
  if (req.session && req.session.user && req.session.user.user_id) {
    return req.session.user.user_id;
  }
  return null;
}

router.get('/all', async (req, res) => {
  try {
    const profiles = await db.getAllProfiles();
    res.render('allProfiles', {
      profiles,
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/my', async (req, res) => {
  // Prevent caching to ensure fresh CSRF token
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const user_id = getUserId(req);
  
  // Ensure CSRF token is available
  if (!req.session.csrfToken) {
    const { generateToken } = require('../middleware/csrf');
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  
  try {
    const profile = await db.getProfileByUserId(user_id);
    
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
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/my', upload.single('image'), async (req, res) => {
  // Validate CSRF token from header
  if (!validateCsrfFromHeader(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  const user_id = getUserId(req);

  try {
    await db.createProfile(name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone, user_id);
    res.redirect("/profiles/my");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/my/update', upload.single('image'), async (req, res) => {
  // Validate CSRF token from header.
  if (!validateCsrfFromHeader(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone, profile_id } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  
  // Authorization check: ensure the profile belongs to the logged-in user
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const profile = await db.getProfileById(profile_id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (profile.user_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized to edit this profile' });
    }
    
    await db.updateProfile(profile_id, name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone);
    res.redirect("/profiles/my");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/my/delete', async (req, res) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const profile = await db.getProfileByUserId(user_id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (profile && profile.image_path) {
      const imagePath = path.join(__dirname, '..', profile.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await db.deleteProfile(profile.profile_id);
    res.redirect('/profiles/my');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/', (req, res) => {
  res.redirect('/profiles/my');
});

router.get('/:id/edit', async (req, res) => {
  // Here we are preventin caching to ensure fresh CSRF token
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) return res.status(404).send("Profile not found");
    
    const lookingForArray = profile.looking_for ? profile.looking_for.split(',') : [];
    
    // Then we ensure CSRF token is available
    if (!req.session.csrfToken) {
      const { generateToken } = require('../middleware/csrf');
      req.session.csrfToken = generateToken();
    }
    res.locals.csrfToken = req.session.csrfToken;
    
    res.render('editProfile', {
      profile,
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
      lookingForArray,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/:id', upload.single('image'), async (req, res) => {
  // Here we are preventing caching to ensure fresh CSRF token.
  if (!validateCsrfFromHeader(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  const user_id = getUserId(req);
  
  // Authorization check: ensure the profile belongs to the logged-in user
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (profile.user_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized to edit this profile' });
    }
    
    await db.updateProfile(req.params.id, name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone);
    res.redirect("/profiles/my");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/:id/delete', async (req, res) => {
  const user_id = getUserId(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    // Authorization check: ensure the profile belongs to the logged-in user
    if (profile.user_id !== user_id) {
      return res.status(403).json({ error: 'Not authorized to delete this profile' });
    }
    
    if (profile && profile.image_path) {
      const imagePath = path.join(__dirname, '..', profile.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await db.deleteProfile(req.params.id);
    res.redirect('/profiles/my');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
