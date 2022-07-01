const md5 = require('md5');
const {v4: uuidv4} = require('uuid');
const mongodb = require('../mongodb/ndbc.js');
const User = require('../models/user.js');

class UserController {
  // 用户注册
  async register(req, res, next) {
    /**
     * x-www-form-urlencoded  req.body
     * form-data  req.fields
     * file  req.files
     **/
    const user_params = req.fields;
    if (!user_params) {
      return res.send({
        status: 0,
        message: '传参格式错误',
      });
    }
    if (!user_params.user_name || !user_params.password) {
      return res.send({
        status: 0,
        message: '用户名或密码格式错误，请重新注册',
      });
    }
    try {
      mongodb(async (db) => {
        const user_collection = db.collection('users');
        const user_exist = await user_collection.find({user_name: user_params.user_name}).toArray();
        if (user_exist.length) {
          return res.send({
            status: 0,
            message: '该用户已存在，请重新注册'
          });
        }
        // 对用户密码进行加密
        const new_user = new User(uuidv4(), user_params.user_name, md5(user_params.password), new Date().getTime());
        await user_collection.insertOne(new_user);
        return res.send({
          status: 1,
          message: '用户注册成功'
        });
      });
    } catch (error) {
      console.error('用户注册功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，用户注册失败',
      });
    }
  }
}

module.exports = new UserController();