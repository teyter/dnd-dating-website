const crypto = require('crypto');
const { securityLog, getClientIp } = require('../logger');

// CSRF Protection Middleware
// Generates and validates CSRF tokens for forms
// This is an helper function to generate secure random token

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper to validate CSRF token from header, so that we can validate it before multer processes the body.
function validateCsrfFromHeader(req) {
  if (!req.session || !req.session.csrfToken) {
    return false;
  }
  
  const submittedToken = req.headers['x-csrf-token'];
  
  if (!submittedToken || submittedToken !== req.session.csrfToken) {
    securityLog('CSRF_ATTACK', `Invalid CSRF token from IP: ${getClientIp(req)}`);
    return false;
  }
  
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
    securityLog('CSRF_ATTACK', `Invalid CSRF token from IP: ${getClientIp(req)}`);
    return res.status(403).render('error', {
      message: 'Invalid CSRF token',
      error: {}
    });
  }
  // we make sure to always rotate token, to keep the same token for the session to prevent frontend mismatch issues
  next();
}

// Separate middleware for validating CSRF token on API routes, we return an JSON error instead of rendering the page
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
