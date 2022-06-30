const createError = require('http-errors');
const express = require('express');
const path = require('path');
const fs = require("fs");
const cookieParser = require('cookie-parser');
// const logger = require('morgan');

// dotenv 从 .env 文件读取环境变量
const dotenv = require("dotenv");
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const pathsDotenv = resolveApp(".env");
// 按优先级由高到低的顺序加载.env文件
dotenv.config({path: `${pathsDotenv}.development.local`});// 加载.env.local
dotenv.config({path: `${pathsDotenv}.development`});  // 加载.env.development
dotenv.config({path: `${pathsDotenv}`}); // 加载.env

// 数据库连接
require('./mongodb/ndbc.js');

const usersRouter = require('./routes/users');

const app = express();

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.send(`${err.status || 500} Error Occurred !`);
});

module.exports = app;
