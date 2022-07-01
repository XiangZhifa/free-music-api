const User = require('../controller/user.js');
const express = require('express');
const formidable = require('express-formidable');
const router = express.Router();

// 只支持form-data格式，否则会无法获取到参数
router.post('/register', formidable(), User.register);

module.exports = router;
