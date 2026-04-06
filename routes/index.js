var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');
const db = require('../Database');
const rateLimit = require('express-rate-limit');
const { log, securityLog, getClientIp } = require('../logger');
const { generateToken } = require('../middleware/csrf');
const {
  validate,
  registerSchema,
  loginSchema,
  sanitizeLookingFor,
  isAdminUser,
  isReservedUsername,
} = require('../middleware/validation');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts (more lenient for testing)
  message: 'Too many login attempts. Try again later.',
  handler: (req, res) => {
    console.log('RATE LIMIT: Login rate limit exceeded for IP:', req.ip);
    log(`AUTH: Rate limit exceeded - IP: ${req.ip}`);
    res.status(429).render('login', {
      error: 'Too many login attempts. Try again later.',
      csrfToken: req.session?.csrfToken || '',
    });
  },
});

// Registration rate limiter, to prevent username enumeration
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 registration attempts (more lenient for testing)
  message: 'Too many registration attempts. Try again later.',
  handler: (req, res) => {
    console.log('RATE LIMIT: Register rate limit exceeded for IP:', req.ip);
    log(`REGISTER: Rate limit exceeded - IP: ${req.ip}`);
    res.status(429).render('register', {
      error: 'Too many registration attempts. Try again later.',
      csrfToken: req.session?.csrfToken || '',
    });
  },
});

router.get('/', function (req, res, next) {
  const websiteName = 'D&D Dating!';
  res.render('index', { websiteName });
});

router.get('/register', (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  req.session.save((err) => {
    if (err) console.error('Session save error:', err);
    res.render('register', { error: null });
  });
});

router.post('/register', registerLimiter, validate(registerSchema), async (req, res, next) => {
  const { name: username, pass, pass2 } = req.validated;

  // Block usernames that impersonate the admin
  if (isAdminUser(username)) {
    return res.status(400).render('register', { error: 'Username not available' });
  }

  // Block reserved usernames that could impersonate admin/privileged roles
  if (isReservedUsername(username)) {
    return res.status(400).render('register', { error: 'Username not available' });
  }

  if (pass !== pass2)
    return res.status(400).render('register', { error: 'Passwords do not match' });

  try {
    const existing = await db.getUserByName(username);
    if (existing) {
      log(`REGISTER: Failed - Username already taken: ${username}`);
      return res.status(400).render('register', { error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(pass, 12);
    await db.createUser(username, hash, 'player');
    log(`REGISTER: Success - New user created: ${username}`);

    return res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

// Login
router.get('/login', (req, res) => {
  // Ensure CSRF token exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  // Force session save so the cookie is set BEFORE the form renders
  req.session.save((err) => {
    if (err) console.error('Session save error:', err);
    res.render('login', { error: null, csrfToken: req.session.csrfToken });
  });
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  const { name: username, pass } = req.validated;

  console.log('LOGIN POST:');
  console.log('session ID:', req.session?.id);
  console.log('session.csrfToken:', req.session?.csrfToken ? 'EXISTS' : 'MISSING');
  console.log('body._csrf:', req.body?._csrf ? 'EXISTS' : 'MISSING');
  console.log('tokens match:', req.body?._csrf === req.session?.csrfToken);

  try {
    console.log('Login attempt for:', username);
    const user = await db.getUserByName(username);
    if (!user) {
      console.log('User not found:', username);
      securityLog(
        'authn_login_fail',
        `username=${username}, reason=user_not_found, ip=${getClientIp(req)}`,
      );
      return res.status(401).render('login', {
        error: 'Invalid username or password',
        csrfToken: req.session?.csrfToken || '',
      });
    }

    console.log('User found:', user.name, 'has pass:', !!user.pass);

    // Check if account is locked
    if (user.locked_until) {
      const lockTime = new Date(user.locked_until);
      const now = new Date();
      if (lockTime > now) {
        const remainingMinutes = Math.ceil((lockTime - now) / 60000);
        securityLog(
          'authn_login_fail',
          `userid=${user.user_id}, reason=account_locked, ip=${getClientIp(req)}`,
        );
        return res.status(423).render('login', {
          error: `Account is locked. Try again in ${remainingMinutes} minutes.`,
          csrfToken: req.session?.csrfToken || '',
        });
      } else {
        // Lock expired, auto-unlock
        await db.unlockAccount(user.user_id);
      }
    }

    // If user has no password set, treat as failed login
    if (!user.pass || typeof user.pass !== 'string') {
      console.log('No password for user:', username);
      securityLog(
        'authn_login_fail',
        `userid=${user.user_id}, reason=no_password, ip=${getClientIp(req)}`,
      );
      return res.status(401).render('login', {
        error: 'Invalid username or password',
        csrfToken: req.session?.csrfToken || '',
      });
    }

    // Verify password
    const ok = await bcrypt.compare(pass, user.pass);
    console.log('Password verification result:', ok);
    if (!ok) {
      console.log('Returning 401 - wrong password');
      securityLog(
        'authn_login_fail',
        `userid=${user.user_id}, reason=wrong_password, ip=${getClientIp(req)}`,
      );

      // Increment failed login attempts
      await db.incrementFailedLogins(user.user_id);
      const attempts = await db.getFailedLogins(user.user_id);

      // Lock account after 10 failed attempts
      if (attempts >= 10) {
        await db.lockAccount(user.user_id, 30);
        securityLog(
          'authn_account_locked',
          `userid=${user.user_id}, reason=exceeded_failed_attempts, ip=${getClientIp(req)}`,
        );
        return res.status(423).render('login', {
          error: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
          csrfToken: req.session?.csrfToken || '',
        });
      }

      return res.status(401).render('login', {
        error: 'Invalid username or password',
        csrfToken: req.session?.csrfToken || '',
      });
    }

    // Reset failed login attempts on successful login
    await db.resetFailedLogins(user.user_id);

    console.log('Password correct, proceeding to session...');

    req.session.regenerate((err) => {
      if (err) {
        console.log('SESSION REGEN ERROR:', err.message);
        log(`LOGIN: Error - Session regeneration failed for user: ${username}`);
        return res
          .status(500)
          .render('login', { error: 'Session error', csrfToken: req.session?.csrfToken || '' });
      }

      // Admin determined by environment variable
      const is_admin = isAdminUser(user.name) ? 1 : 0;
      req.session.user = {
        user_id: user.user_id,
        name: user.name,
        is_admin,
        user_type: user.user_type,
      };
      // Regenerate CSRF token after session wipe (session.regenerate clears the session)
      req.session.csrfToken = require('../middleware/csrf').generateToken();
      console.log('Login successful for:', user.name);

      // Log successful authentication using OWASP vocabulary
      securityLog('authn_login_success', `userid=${user.user_id}, ip=${getClientIp(req)}`);

      let redirectTo = req.session.returnTo || '/';
      delete req.session.returnTo;

      if (!redirectTo.startsWith('/')) redirectTo = '/';

      return res.redirect(redirectTo);
    });
  } catch (err) {
    console.log('LOGIN ERROR:', err.message);
    console.log(err.stack);
    log(`LOGIN: Error - ${err.message}, stack: ${err.stack}`);
    next(err);
  }
});

// Logout (POST)
router.post('/logout', (req, res) => {
  const userName = req.session?.user?.name || 'Unknown';
  const userId = req.session?.user?.user_id || 'unknown';
  securityLog('session_expired', `userid=${userId}, ip=${getClientIp(req)}`);
  log(`LOGOUT: User logged out: ${userName}`);
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
