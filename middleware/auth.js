function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // Remember where they were trying to go
  req.session.returnTo = req.originalUrl;

  return res.redirect("/login");
}

module.exports = { requireLogin };
