function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // Remember where they were trying to go
  req.session.returnTo = req.originalUrl;

  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) {
    return next();
  }

  // If not logged in, redirect to login
  if (!req.session || !req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }

  // Logged in but not admin - redirect to home
  return res.redirect("/");
}

module.exports = { requireLogin, requireAdmin };
