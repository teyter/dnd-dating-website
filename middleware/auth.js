function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) {
    return next();
  }

  if (!req.session || !req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }

  return res.redirect("/");
}

function requirePremium(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_premium) {
    return next();
  }

  if (!req.session || !req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }

  return res.redirect("/");
}

module.exports = {
  requireLogin,
  requireAdmin,
  requirePremium
};
