var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
const { log } = require('./logger');
var session = require('express-session');
const { requireLogin, requireAdmin } = require('./middleware/auth');
const db = require('./Database');

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

// Security headers middleware, here we set various HTTP headers to enhance security, such as Content Security Policy or X-Frame-Options.
//this is important, as it sets security headers to prevent XSS and clickjacking attacks.
app.use((req, res, next) => {
  // Content Security Policy that prevents XSS.
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https://i.pinimg.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
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

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Here we make sure that the session must be defined BEFORE the protected uploads middleware, 
// otherwise we won't be able to check if the user is authenticated when they try to access /uploads, which would cause a crash.
app.use(session({
  secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { 
    throw new Error('SESSION_SECRET must be set in production'); })() : "dev-secret-for-testing-only"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'lax', // baseline CSRF mitigation (blocks many cross-site cookie sends)
    maxAge: 1000 * 60 * 60 // 1 hour session timeout
  }
}));

// CSRF Token Middleware for anti-CSRF
const csrf = require("csurf");
const csrfProtection = csrf();

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  const isMultipart = contentType.includes('multipart/form-data');

  const skipCsurf =
    req.method === 'POST' &&
    isMultipart &&
    req.path === '/profiles/my';

  if (skipCsurf) {
    return next();
  }

  return csrfProtection(req, res, next);
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).render("error", {
      statusCode: 403,
      message: "Invalid CSRF token"
    });
  }
  next(err);
});

app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('./middleware/csrf').generateToken();
  }

  try {
    res.locals.csrfToken = req.csrfToken();
  } catch (e) {
    res.locals.csrfToken = null;
  }

  res.locals.customCsrfToken = req.session.csrfToken;
  next();
});

// Protected uploads directory, requires authentication from session.
// This middleware ensures that only authenticated users can access the /uploads directory and prevents unauthorized access to uploaded files
app.use('/uploads', (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(403).send('Access denied');
}, express.static(path.join(__dirname, 'uploads')));

// Here we use Input sanitization middleware, meaning that we escapes HTML to prevent XSS, 
// so as an example if a user tries to input <script>alert('XSS')</script> it will be escaped to
//  &lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt; and won't execute as code in the browser, but instead will be displayed as text.
//  This prevent cross-site scripting attacks.
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


// Page view analytics middleware, it is for the log page views for admin dashboard
app.use(async (req, res, next) => {
  // we only track GET requests, we track meaningful pages (not static files), like /profiles. 
  // This allows us to see which pages are most popular and how users navigate the site,
  if (req.method === 'GET' && req.path) {
    try {
      const userId = req.session && req.session.user ? req.session.user.user_id : null;
      const pageName = req.path.split('?')[0];
      if (pageName && !pageName.startsWith('/stylesheets') && !pageName.startsWith('/javascripts') && !pageName.startsWith('/images')) {
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
app.use('/messages', requireLogin, require('./routes/messages'));
app.use('/admin', requireLogin, requireAdmin, adminRouter);

// Our custom 404 error page, it renders a user-friendly error page instead of the default Express 404 response.
app.get('/404error', function(req, res) {
  res.status(404).render('error', { statusCode: 404, message: 'Page not found' });
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  // Log the error (full stack in development, message only in production)
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
    res.render('error');
  } else {
    // API request, respond with JSON error message, this is for API endpoints that expect JSON responses, 
    // so we return a structured JSON error message instead of HTML.
    const status = err.status || 500;
    const response = {
      error: {
        status,
        message: status === 404 ? 'Not found' : 'Internal server error',
      }
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
