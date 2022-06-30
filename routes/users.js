const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(process.env.NODE_ENV);
  res.send('Users');
});

module.exports = router;
