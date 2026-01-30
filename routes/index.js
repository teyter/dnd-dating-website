var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const websiteName = "D&D Dating!";
  res.render('index', { websiteName });
});

module.exports = router;
