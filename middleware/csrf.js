// CSRF Protection Middleware
// Generates and validates CSRF tokens for forms

const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper to validate CSRF token from header (works with multer/multipart)
function validateCsrfFromHeader(req) {
  console.log('CSRF Debug - Session:', req.session ? 'exists' : 'missing');
  console.log('CSRF Debug - Session token:', req.session?.csrfToken ? 'exists' : 'missing');
  console.log('CSRF Debug - Header token:', req.headers['x-csrf-token'] ? 'exists' : 'missing');
  
  if (!req.session || !req.session.csrfToken) {
    console.log('CSRF Debug - No session or token');
    return false;
  }
  
  const submittedToken = req.headers['x-csrf-token'];
  console.log('CSRF Debug - Comparing:', { submitted: submittedToken, session: req.session.csrfToken });
  
  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    console.log('CSRF Debug - Token mismatch');
    return false;
  }
  
  // Rotate token on successful validation
  req.session.csrfToken = generateToken();
  console.log('CSRF Debug - Token valid, rotated');
  return true;
}

function csrfMiddleware(req, res, next) {
  // Skip CSRF validation for GET requests
  if (req.method === 'GET') {
    // Ensure session exists
    if (req.session) {
      if (!req.session.csrfToken) {
        req.session.csrfToken = generateToken();
      }
      res.locals.csrfToken = req.session.csrfToken;
    }
    return next();
  }

  // For POST requests with multipart/form-data, we'll validate CSRF in the route handler
  // because multer processes the body first and we need to check after multer
  if (req.method === 'POST' && req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Ensure session exists and token is set for the form
    if (req.session) {
      if (!req.session.csrfToken) {
        req.session.csrfToken = generateToken();
      }
      res.locals.csrfToken = req.session.csrfToken;
    }
    return next();
  }

  // For other POST requests, validate CSRF token
  if (!req.session || !req.session.csrfToken) {
    return res.status(403).render('error', {
      message: 'Invalid CSRF token',
      error: {}
    });
  }

  const submittedToken = (req.body && req.body._csrf) || req.headers['x-csrf-token'];
  
  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    return res.status(403).render('error', {
      message: 'Invalid CSRF token',
      error: {}
    });
  }

  // Generate new token after successful validation (token rotation)
  req.session.csrfToken = generateToken();
  res.locals.csrfToken = req.session.csrfToken;

  next();
}

// Separate middleware for validating CSRF token on API routes, returns JSON error instead of rendering the page
function validateCsrf(req, res, next) {
  if (!req.session || !req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  const submittedToken = (req.body && req.body._csrf) || req.headers['x-csrf-token'];
  
  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

module.exports = { csrfMiddleware, validateCsrf, generateToken, validateCsrfFromHeader };
