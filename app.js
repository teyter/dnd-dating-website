var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
const { log } = require('./logger');
var session = require('express-session');
const helmet = require('helmet');
const { requireLogin, requireAdmin } = require('./middleware/auth');
const db = require('./Database');

// Production configuration
const isProduction = process.env.NODE_ENV === 'production';

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

// Trust proxy for correct IP detection behind nginx/load balancer
app.set('trust proxy', 1);

// Disable x-powered-by header
app.disable('x-powered-by');

// Request size limit - protect against large payload attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Helmet for security headers - configure for production
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://i.pinimg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'"],
      },
    },
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    hidePoweredBy: true,
  }),
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Here we make sure that the session must be defined BEFORE the protected uploads middleware,
const SESSION_ABSOLUTE_TIMEOUT = 1000 * 60 * 60 * 8; // 8 hours absolute max
const SESSION_IDLE_TIMEOUT = 1000 * 60 * 60; // 1 hour idle timeout

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      (process.env.NODE_ENV === 'production'
        ? (() => {
            throw new Error('SESSION_SECRET must be set in production');
          })()
        : 'dev-secret-for-testing-only'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_IDLE_TIMEOUT,
    },
  }),
);

// Absolute session timeout - invalidate session after 8 hours regardless of activity
app.use((req, res, next) => {
  if (req.session && req.session.sessionStart) {
    const elapsed = Date.now() - req.session.sessionStart;
    if (elapsed > SESSION_ABSOLUTE_TIMEOUT) {
      return req.session.destroy((err) => {
        if (err) {
          console.log('Session destroy error:', err.message);
        }
        return res.redirect('/login?reason=session_expired');
      });
    }
  } else if (req.session) {
    req.session.sessionStart = Date.now();
  }
  next();
});

// CSRF - use custom middleware from middleware/csrf.js
const { csrfMiddleware } = require('./middleware/csrf');

app.use((req, res, next) => {
  console.log(`[CSRF DEBUG] ${req.method} ${req.path}`);
  console.log(`[CSRF DEBUG] session.csrfToken exists:`, !!req.session?.csrfToken);
  console.log(`[CSRF DEBUG] body._csrf:`, req.body?._csrf ? 'present' : 'missing');
  console.log(
    `[CSRF DEBUG] header x-csrf-token:`,
    req.headers['x-csrf-token'] ? 'present' : 'missing',
  );
  next();
});

app.use(csrfMiddleware);

app.use((req, res, next) => {
  // csrfMiddleware already set req.session.csrfToken
  res.locals.csrfToken = req.session.csrfToken || null;
  res.locals.customCsrfToken = req.session.csrfToken || null;
  next();
});

// Protected uploads directory, requires authentication from session.
// This middleware ensures that only authenticated users can access the /uploads directory and prevents unauthorized access to uploaded files
app.use(
  '/uploads',
  (req, res, next) => {
    if (req.session && req.session.user) {
      return next();
    }
    return res.status(403).send('Access denied');
  },
  express.static(path.join(__dirname, 'uploads')),
);

// XSS Prevention: EJS's <%= %> tag automatically escapes HTML output.
// We rely on EJS's built-in escaping rather than pre-escaping input,
// which would cause double-escaping and display issues.
// Always use <%= %> for user content, never <%- %>.

app.use(function (req, res, next) {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});

// Page view analytics middleware, it is for the log page views for admin dashboard
app.use(async (req, res, next) => {
  // we only track GET requests, we track meaningful pages (not static files), like /profiles.
  // This allows us to see which pages are most popular and how users navigate the site,
  if (req.method === 'GET' && req.path) {
    try {
      const userId = req.session && req.session.user ? req.session.user.user_id : null;
      const pageName = req.path.split('?')[0];
      if (
        pageName &&
        !pageName.startsWith('/stylesheets') &&
        !pageName.startsWith('/javascripts') &&
        !pageName.startsWith('/images')
      ) {
        await db.logPageView(pageName, userId);
      }
    } catch (err) {
      console.log('Page view log error:', err.message);
    }
  }
  next();
});

// Content-Type validation for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    // Here we check if the Content-Type of the POST request is one of the allowed types:
    // Allow multipart/form-data (file uploads), application/json, and application/x-www-form-urlencoded
    // If it's not, we return a 415 Unsupported Media Type error. T
    // his helps prevent attacks that rely on sending unexpected content types to the server.
    if (
      !contentType.includes('multipart/form-data') &&
      !contentType.includes('application/json') &&
      !contentType.includes('application/x-www-form-urlencoded')
    ) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }
  }
  next();
});

app.use('/', indexRouter);
app.use('/users', requireLogin, usersRouter);
app.use('/profiles', requireLogin, profilesRouter);
app.use('/messages', requireLogin, require('./routes/messages'));
app.use('/admin', requireLogin, requireAdmin, adminRouter);

// Our custom 404 error page, it renders a user-friendly error page instead of the default Express 404 response.
app.get('/404error', function (req, res) {
  res.status(404).render('error', { statusCode: 404, message: 'Page not found' });
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  // Log the error (full stack in development, message only in production)
  console.log('ERROR CAUGHT:', err.message);
  if (req.app.get('env') === 'development') {
    log(`ERROR: ${err.message}\nStack: ${err.stack}`);
  } else {
    log(`ERROR: ${err.message}`);
  }

  // Determine the response format
  if (req.accepts('html') && !req.xhr) {
    // Browser request, to render our custom HTML error page
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.statusCode = err.status || 500;
    res.status(err.status || 500);
    res.render('error', { statusCode: err.status || 500 });
  } else {
    // API request, respond with JSON error message, this is for API endpoints that expect JSON responses,
    // so we return a structured JSON error message instead of HTML.
    const status = err.status || 500;
    const response = {
      error: {
        status,
        message: status === 404 ? 'Not found' : 'Internal server error',
      },
    };
    // Optionally include stack trace in development
    if (req.app.get('env') === 'development') {
      response.error.stack = err.stack;
    }
    res.status(status).json(response);
  }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.message}\nStack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`UNHANDLED REJECTION: ${reason}`);
  process.exit(1);
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}
