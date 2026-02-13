var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const { requireLogin, requireAdmin } = require('./middleware/auth');
const { csrfMiddleware } = require('./middleware/csrf');

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var profilesRouter = require('./routes/profiles');
var adminRouter = require('./routes/admin');

var app = express();

// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy that prevents XSS by controlling resources
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://i.pinimg.com; " +
    "font-src 'self'; " +
    "connect-src 'self'"
  );
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection (legacy but still helpful)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'lax', // CSRF protection, which blocks cross-site POST requests
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Input sanitization middleware, escapes HTML to prevent XSS
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    }
  }
  next();
});

app.use(function(req, res, next) {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});

// CSRF protection middleware
app.use(csrfMiddleware);

// Content-Type validation for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    
    // Allow multipart/form-data (file uploads), application/json, and application/x-www-form-urlencoded
    if (!contentType.includes('multipart/form-data') && 
        !contentType.includes('application/json') && 
        !contentType.includes('application/x-www-form-urlencoded')) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }
  }
  next();
});

app.use('/', indexRouter);
app.use('/users', requireLogin, usersRouter);
app.use('/profiles', requireLogin, profilesRouter);
app.use('/admin', requireLogin, requireAdmin, adminRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}
