const md5 = require('md5');
const {v4: uuidv4} = require('uuid');
const fs = require('fs');
// 以下三个图片压缩插件，请按固定版本号安装，否则会有兼容性问题
// "imagemin": "7.0.1",
const imagemin = require('imagemin');
// "imagemin-jpegtran": "7.0.0",
const imageminJpegtran = require('imagemin-jpegtran');
// "imagemin-pngquant": "7.0.0",
const imageminPngquant = require('imagemin-pngquant');
const {encrypt, decrypt} = require('../untils/crypto');
const mongodb = require('../mongodb/ndbc.js');
const User = require('../models/user.js');
const cities = require('../public/json/cityCode.js');

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
      console.error('登录失败', err);
      res.send({
        status: 0,
        message: '系统异常，登录失败',
      })
    }
  }

  // 用户退出
  async logout(req, res, next) {
    try {
      mongodb(async (db) => {
        const user_collection = db.collection('users');
        await user_collection.updateOne({id: req.headers.userId}, {$set: {token: ''}});
        res.send({
          status: 1,
          message: '退出登录成功',
        });
      })
    } catch (error) {
      console.error('退户登录，功能异常', error);
      res.send({
        status: 0,
        message: '系统异常，退出登录失败'
      });
    }
  }

  // 获取用户个人信息
  async getUserInfo(req, res, next) {
    try {
      const userId = req.headers.userId;
      mongodb(async (db) => {
        const user_collection = db.collection('users');
        const current_user = await user_collection.findOne({id: userId});
        delete current_user._id;
        delete current_user.token;
        delete current_user.password;
        res.send({
          status: 1,
          data: current_user,
        });
      });
    } catch (error) {
      console.error('获取用户信息，功能异常', error);
      res.send({
        status: 0,
        message: '系统异常，获取用户信息失败'
      });
    }
  }

  // 更新用户个人信息
  async updateUserInfo(req, res, next) {
    try {
      const userParams = req.body;
      // 参数不能为空
      if (!userParams || JSON.stringify(userParams) === '{}') return res.send({
        status: 0,
        message: '参数格式错误'
      });
      const userId = req.headers.userId;
      // 性别只能是 0 1 2
      if (isNaN(userParams.gender) ||
        Math.floor(userParams.gender) < 0 ||
        Math.floor(userParams.gender) > 2) return res.send({
        status: 0,
        message: '性别参数异常，更新用户信息失败'
      });
      // 生日不能是当前时间之后 生日也不能是早于120年前
      const birthTimeTemp = new Date(userParams.birthday).getTime();
      const nowTimeTemp = new Date().getTime();
      if (isNaN(birthTimeTemp) ||
        nowTimeTemp - birthTimeTemp < 0 ||
        nowTimeTemp - birthTimeTemp > 120 * 365 * 24 * 60 * 60 * 1000) {
        return res.send({
          status: 0,
          message: '生日参数异常，更新用户信息失败'
        });
      }
      // 城市必须是 cityCode.js 中存在的城市
      const hasCity = cities.find((province) => province.cities[userParams.current_city] !== undefined);
      if (!hasCity) return res.send({
        status: 0,
        message: '城市参数异常，更新用户信息失败'
      });
      mongodb(async (db) => {
        const user_collection = db.collection('users');
        await user_collection.updateOne({id: userId}, {
          $set: {
            introduction: userParams.introduction,
            gender: Math.floor(userParams.gender),
            birthday: new Date(userParams.birthday).getTime(),
            current_city: userParams.current_city
          }
        });
        res.send({
          status: 1,
          message: '更新用户信息成功'
        });
      })
    } catch (error) {
      console.error('更新用户信息，功能异常', error);
      res.send({
        status: 0,
        message: '系统异常，更新用户信息失败'
      });
    }
  }

  // 用户上传头像
  async uploadAvatar(req, res, next) {
    const avatar_file = req.files.avatar;
    const file_ext = avatar_file.type;
    const user_id = req.headers.userId;
    if (file_ext !== 'image/png') return res.send({
      status: 0,
      message: '仅支持png格式头像上传'
    });
    if (avatar_file.size > 20 * 1024) return res.send({
      status: 0,
      message: '仅支持20kb以下头像上传'
    });
    try {
      const readAvatarStream = fs.createReadStream(avatar_file.path);
      const writeAvatarStream = fs.createWriteStream(`web/public/img/avatars/${user_id}_avatar.png`);
      readAvatarStream.pipe(writeAvatarStream);
      readAvatarStream.on('end', function () {
        fs.unlinkSync(avatar_file.path);
      });
    } catch (err) {
      if (err) {
        console.error(err);
        return res.send({
          status: 0,
          message: '上传头像失败'
        })
      }
    }
    // 将头像路径存入数据库
    await mongodb(async (db) => {
      const user_collection = db.collection('users');
      await user_collection.updateOne({id: user_id}, {
        $set: {
          avatar: `web/public/img/avatars/${user_id}_avatar.png`
        }
      });
      return res.send({
        status: 1,
        message: '上传头像成功'
      });
    });
    // 对50kb以上图片进行压缩(因插件问题，暂时无法压缩)
    if (avatar_file.size > 50 * 1024) {
      try {
        await imagemin([`web/public/img/avatars/${user_id}_avatar.png`], {
          destination: 'web/public/img/avatars',
          plugins: [
            imageminJpegtran(),
            imageminPngquant({
              quality: [0.01, 0.02]
            })
          ]
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  // 生成新token
  getNewToken(userId) {
    const secret = encrypt(`${userId}_${new Date().getTime()}`);
    return `${secret.iv}IV${secret.content}`
  }
}

module.exports = new UserController();