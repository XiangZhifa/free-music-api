const md5 = require('md5');
const {v4: uuidv4} = require('uuid');
const {encrypt, decrypt} = require('../untils/crypto');
const mongodb = require('../mongodb/ndbc.js');
const User = require('../models/user.js');

class UserController {
  constructor() {
    this.login = this.login.bind(this)
  }

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

  // 用户登录
  async login(req, res, next) {
    const user_params = req.fields;
    const {user_name, password} = user_params;
    if (!user_params) {
      return res.send({
        status: 0,
        message: '传参格式错误',
      });
    }
    if (!user_name || !password) {
      return res.send({
        status: 0,
        message: '用户名或密码错误，请重新登录',
      });
    }
    // 对密码进行加密后 与数据库比对
    const md5_password = md5(password);
    try {
      mongodb(async (db) => {
        const user_collection = db.collection('users');
        const user_exist = await user_collection.find({user_name}).toArray();
        if (user_exist.length === 0) {
          return res.send({
            status: 0,
            message: '用户不存在，请先注册',
          })
        }
        if (md5_password !== user_exist[0].password) {
          return res.send({
            status: 0,
            message: '密码错误，登录失败',
          })
        }
        let token = user_exist[0].token;
        // 用户无token 直接生成新token
        if (!token) {
          const new_token = this.getNewToken(user_exist[0].id);
          await user_collection.updateOne({id: user_exist[0].id}, {$set: {token: new_token}});
          return res.send({
            status: 1,
            token: new_token,
            message: '登录成功',
          });
        }
        // 用户有token时，token过期 ? 生成新token，并存入数据库 : 直接返回旧token
        const userIdTimeTemp = decrypt({
          iv: token.split('IV')[0],
          content: token.split('IV')[1]
        });
        const tokenTimeTemp = +userIdTimeTemp.split('_')[1];
        if (new Date().getTime() - tokenTimeTemp > 24 * 60 * 60 * 1000) {
          token = this.getNewToken(user_exist[0].id);
          await user_collection.updateOne({id: user_exist[0].id}, {$set: {token}});
        }
        return res.send({
          status: 1,
          token: token,
          message: '登录成功',
        });
      });
    } catch (err) {
      console.log('登录失败', err);
      res.send({
        status: 0,
        message: '系统异常，登录失败',
      })
    }
  }

  // 生成新token
  getNewToken(userId) {
    const secret = encrypt(`${userId}_${new Date().getTime()}`);
    return `${secret.iv}IV${secret.content}`
  }
}

module.exports = new UserController();