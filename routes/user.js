const User = require('../controller/user.js');
const checkAuth = require('../middlewares/checkAuth.js');
const express = require('express');
const formidable = require('express-formidable');
const router = express.Router();

// 参数只支持form-data格式，否则会无法获取到参数
router.post('/register', formidable(), User.register);

// 参数只支持form-data格式，否则会无法获取到参数
router.post('/login', formidable(), User.login);

router.post('/logout', checkAuth.checkToken, User.logout);

router.get('/getUserInfo', checkAuth.checkToken, User.getUserInfo);

router.post('/updateUserInfo', checkAuth.checkToken, User.updateUserInfo);

module.exports = router;
