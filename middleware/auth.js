function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // If not logged in, save the original URL and redirect to login, so we can remember where to go after successful login
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

function requireDM(req, res, next) {
  if (!req.session || !req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }

  const type = req.session.user.user_type;

  if (type === "dm" || type === "both") {
    return next();
  }

  return res.status(403).send("Access denied: DM role required");
}
module.exports = { requireLogin, requireAdmin, requireDM };
