var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');

const db = require('../Database');
const { requireLogin, requireDM } = require('../middleware/auth');
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

router.get('/all', requireLogin, requireDM, async (req, res) => {
  try {
    const profiles = await db.getAllProfiles();
    const currentUserId = req.session && req.session.user ? req.session.user.user_id : null;
    
    // Add user info to each profile
    const profilesWithUser = await Promise.all(
      profiles.map(async (profile) => {
        const user = await db.getUserById(profile.user_id);
        let hasConnection = false;
        let requestSent = false;
        
        if (currentUserId && currentUserId !== profile.user_id) {
          hasConnection = await db.hasMessageConnection(currentUserId, profile.user_id);
          if (!hasConnection) {
            const requests = await db.getMessageRequests(profile.user_id);
            requestSent = requests.some(r => r.from_user_id === currentUserId);
          }
        }
        
        return {
          ...profile,
          user_type: user ? user.user_type : null,
          is_admin: user ? user.is_admin : 0,
          hasConnection,
          requestSent
        };
      })
    );
    res.render('allProfiles', {
      profiles: profilesWithUser,
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/user/:username', async (req, res) => {
  try {
    const user = await db.getUserByName(req.params.username);
    if (!user) {
      return res.status(404).render('../views/error', { statusCode: 404 });
    }
    
    const profile = await db.getProfileByUserId(user.user_id);
    if (!profile) {
      return res.status(404).render('../views/error', { statusCode: 404 });
    }
    
    const lookingForArray = profile.looking_for ? profile.looking_for.split(',') : [];
    
    res.render('viewProfile', {
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

// here we are preventing caching to ensure fresh CSRF token. 
router.get('/my', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const user_id = getUserId(req);
  
  // here we ensure CSRF token is available
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
  // Validate the CSRF token from the header, since this is a multipart/form-data request and we can't
  //  validate it in the middleware before multer processes the body.
  if (!validateCsrfFromHeader(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone, user_type } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  const user_id = getUserId(req);

  try {
    await db.createProfile(name, race, clazz, Number(level) || 1, bio, imagePath, lookingForArray, experience_level, timezone, user_id);
    
    // here we set the user_type, we allow users to set their user_type on profile creation, but they can also change it later in the edit profile page.
    if (user_type && ['player', 'dm', 'both'].includes(user_type)) {
      await db.updateUserType(user_id, user_type);
    }
    
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
  
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone, profile_id, user_type } = req.body;
  console.log('DEBUG - user_type from form:', user_type);
  console.log('DEBUG - profile_id:', profile_id);
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  
  //  here we check authorization to ensure the profile belongs to the logged-in user.
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
    
    // Update user_type
    console.log('DEBUG - checking user_type:', user_type, 'valid:', ['player', 'dm', 'both'].includes(user_type));
    if (user_type && ['player', 'dm', 'both'].includes(user_type)) {
      console.log('DEBUG - updating user_type to:', user_type, 'for user_id:', user_id);
      await db.updateUserType(user_id, user_type);
      // Update session for user_type
      if (req.session.user) {
        req.session.user.user_type = user_type;
      }
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const user_id = getUserId(req);
  
  if (!user_id) {
    return res.redirect('/login');
  }
  
  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) return res.status(404).send("Profile not found");
    
    const user = await db.getUserById(user_id);
    if (profile.user_id !== user_id) {
      res.locals.statusCode = 403;
      return res.status(403).render('../views/error');
    }
    
    const lookingForArray = profile.looking_for ? profile.looking_for.split(',') : [];
    
    if (!req.session.csrfToken) {
      const { generateToken } = require('../middleware/csrf');
      req.session.csrfToken = generateToken();
    }
    res.locals.csrfToken = req.session.csrfToken;
    
    res.render('editProfile', {
      profile,
      user: { user_id: user.user_id, name: user.name, user_type: user.user_type, is_admin: user.is_admin },
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
  if (!validateCsrfFromHeader(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  const { name, race, class: clazz, level, bio, looking_for, experience_level, timezone } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = Array.isArray(looking_for) ? looking_for.join(',') : looking_for;
  const user_id = getUserId(req);
  
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
