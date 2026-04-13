var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var fs = require('fs');

const db = require('../Database');
const { validateCsrf, validateCsrfFromHeader } = require('../middleware/csrf');
const { requirePermission, PERMISSIONS, getUserId } = require('../middleware/auth');
const {
  validate,
  profileSchema,
  sanitizeLookingFor,
  DND_CLASSES: VALID_CLASSES,
  DND_RACES: VALID_RACES,
  EXPERIENCE_LEVELS,
  TIMEZONES,
} = require('../middleware/validation');

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

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Here we have implemented file upload handling using multer.
// We store uploaded files in the /uploads directory and we generate unique filenames to prevent collisions. 
// We also validate the file type to allow only certain image formats and we set a file size limit. 
// Additionally, we check for duplicate files by comparing the contents of the uploaded file with existing files in the uploads directory, 
// if a duplicate is found, we reuse the existing file instead of saving a new one, to savestorage space and prevents unnecessary duplicates.
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  },
});

// Use constants from validation module instead of duplicating
const DND_CLASSES = VALID_CLASSES;
const DND_RACES = VALID_RACES;

router.get('/all', requirePermission(PERMISSIONS.VIEW_PROFILES), async (req, res, next) => {
  try {
    const profiles = await db.getAllProfiles();
    const currentUserId = req.session && req.session.user ? req.session.user.user_id : null;

    // Add user info to each profile
    const profilesWithUser = await Promise.all(
      profiles.map(async (profile) => {
        const user = await db.getUserById(profile.user_id);
        if (!user) return null; // Skip profiles with deleted users
        let hasConnection = false;
        let requestSent = false;

        if (currentUserId && currentUserId !== profile.user_id) {
          hasConnection = await db.hasMessageConnection(currentUserId, profile.user_id);
          if (!hasConnection) {
            const requests = await db.getMessageRequests(profile.user_id);
            requestSent = requests.some((r) => r.from_user_id === currentUserId);
          }
        }

        return {
          ...profile,
          user_type: user ? user.user_type : null,
          is_admin: user ? user.is_admin : 0,
          hasConnection,
          requestSent,
        };
      }),
    );
    const validProfiles = profilesWithUser.filter((p) => p !== null);
    res.render('allProfiles', {
      profiles: validProfiles,
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/user/:username', async (req, res, next) => {
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
    next(err);
  }
});

// here we are preventing caching to ensure fresh CSRF token.
router.get('/my', requirePermission(PERMISSIONS.EDIT_OWN_PROFILE), async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const user_id = getUserId(req);

  // here we ensure CSRF token is available
  if (!req.session.csrfToken) {
    const { generateToken } = require('../middleware/csrf');
    req.session.csrfToken = generateToken();
  }
  res.locals.customCsrfToken = req.session.csrfToken;

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
    next(err);
  }
});

router.post('/my', upload.single('image'), async (req, res, next) => {
  // Validate the CSRF token from the header, since this is a multipart/form-data request and we can't
  //  validate it in the middleware before multer processes the body.
  if (!validateCsrfFromHeader(req)) {
    // Delete uploaded file if CSRF validation fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
      });
    }
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  const {
    name,
    race,
    class: clazz,
    level,
    bio,
    looking_for,
    experience_level,
    timezone,
    user_type,
  } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : null;
  const lookingForArray = sanitizeLookingFor(looking_for);
  const user_id = getUserId(req);

  try {
    // Use transaction to ensure atomicity
    await db.beginTransaction();

    await db.createProfile(
      name,
      race,
      clazz,
      Number(level) || 1,
      bio,
      imagePath,
      lookingForArray.join(','),
      experience_level,
      timezone,
      user_id,
    );

    // here we set the user_type, we allow users to set their user_type on profile creation, but they can also change it later in the edit profile page.
    if (user_type && ['player', 'dm', 'both'].includes(user_type)) {
      await db.updateUserType(user_id, user_type);
    }

    await db.commitTransaction();
    res.redirect('/profiles/my');
  } catch (err) {
    // Rollback transaction on error
    try {
      await db.rollbackTransaction();
    } catch (rollbackErr) {
      console.error('Transaction rollback failed:', rollbackErr);
    }

    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
      });
    }

    next(err);
  }
});

router.post('/my/update', upload.single('image'), async (req, res, next) => {
  // Validate CSRF token from header.
  if (!validateCsrfFromHeader(req)) {
    // Delete uploaded file if CSRF validation fails
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
      });
    }
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  const {
    name,
    race,
    class: clazz,
    level,
    bio,
    looking_for,
    experience_level,
    timezone,
    profile_id,
    user_type,
  } = req.body;
  console.log('DEBUG - user_type from form:', user_type);
  console.log('DEBUG - profile_id:', profile_id);
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = sanitizeLookingFor(looking_for);

  //  here we check authorization to ensure the profile belongs to the logged-in user.
  const user_id = getUserId(req);
  if (!user_id) {
    // Delete uploaded file if not authenticated
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
      });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const profile = await db.getProfileById(profile_id);
    if (!profile) {
      // Delete uploaded file if profile not found
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
        });
      }
      return res.status(404).json({ error: 'Profile not found' });
    }
    if (profile.user_id !== user_id) {
      // Delete uploaded file if not authorized
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
        });
      }
      return res.status(403).json({ error: 'Not authorized to edit this profile' });
    }

    // Use transaction to ensure atomicity
    await db.beginTransaction();

    // Update user_type
    console.log(
      'DEBUG - checking user_type:',
      user_type,
      'valid:',
      ['player', 'dm', 'both'].includes(user_type),
    );
    if (user_type && ['player', 'dm', 'both'].includes(user_type)) {
      console.log('DEBUG - updating user_type to:', user_type, 'for user_id:', user_id);
      await db.updateUserType(user_id, user_type);
      // Update session for user_type
      if (req.session.user) {
        req.session.user.user_type = user_type;
      }
    }

    await db.updateProfile(
      profile_id,
      name,
      race,
      clazz,
      Number(level) || 1,
      bio,
      imagePath,
      lookingForArray.join(','),
      experience_level,
      timezone,
    );

    await db.commitTransaction();
    res.redirect('/profiles/my');
  } catch (err) {
    // Rollback transaction on error
    try {
      await db.rollbackTransaction();
    } catch (rollbackErr) {
      console.error('Transaction rollback failed:', rollbackErr);
    }

    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete orphaned file:', unlinkErr);
      });
    }

    next(err);
  }
});

router.post('/my/delete', async (req, res, next) => {
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
    next(err);
  }
});

router.get('/', (req, res, next) => {
  res.redirect('/profiles/my');
});

router.get('/:id/edit', async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const user_id = getUserId(req);

  if (!user_id) {
    return res.redirect('/login');
  }

  try {
    const profile = await db.getProfileById(req.params.id);
    if (!profile) return res.status(404).send('Profile not found');

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
    res.locals.customCsrfToken = req.session.csrfToken;

    res.render('editProfile', {
      profile,
      user: {
        user_id: user.user_id,
        name: user.name,
        user_type: user.user_type,
        is_admin: user.is_admin,
      },
      classes: DND_CLASSES,
      races: DND_RACES,
      experienceLevels: EXPERIENCE_LEVELS,
      timezones: TIMEZONES,
      lookingForArray,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', upload.single('image'), async (req, res, next) => {
  console.log('POST /profiles/:id - CSRF validation');
  console.log('  session.csrfToken:', req.session?.csrfToken ? 'exists' : 'missing');
  console.log('  body._csrf:', req.body?._csrf ? 'present' : 'missing');
  console.log('  headers[x-csrf-token]:', req.headers['x-csrf-token'] ? 'present' : 'missing');

  if (!validateCsrfFromHeader(req)) {
    console.log('  CSRF validation FAILED');
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  console.log('  CSRF validation passed');

  const {
    name,
    race,
    class: clazz,
    level,
    bio,
    looking_for,
    experience_level,
    timezone,
  } = req.body;
  const imagePath = req.file ? '/uploads/' + req.file.filename : req.body.existing_image;
  const lookingForArray = sanitizeLookingFor(looking_for);
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

    await db.updateProfile(
      req.params.id,
      name,
      race,
      clazz,
      Number(level) || 1,
      bio,
      imagePath,
      lookingForArray.join(','),
      experience_level,
      timezone,
    );
    res.redirect('/profiles/my');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async (req, res, next) => {
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
    next(err);
  }
});

module.exports = router;
