const {decrypt} = require('../untils/crypto');
const mongodb = require('../mongodb/ndbc.js');

class CheckAuth {
  constructor() {

  }

  async checkToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
      return res.send(401, {
        status: 0,
        message: '无效token，请重新登录',
      })
    }
    const [userId, timeTemp] = decrypt({
        iv: token.split('IV')[0],
        content: token.split('IV')[1]
      }
    ).split('_');
    await mongodb(async (db) => {
      const user_collection = db.collection('users');
      const token_exist = await user_collection.findOne({token});
      // 如果是传入的 token 不存在，返回401
      if (!token_exist) return res.send(401, {
        status: 0,
        message: '无效token，请重新登录',
      });
      // token 过期，清除token，并返回401
      const tokenInterval = new Date().getTime() - +timeTemp;
      if (tokenInterval > 24 * 60 * 60 * 1000) {
        // token存在，但已超时，清除token
        await user_collection.updateOne({token}, {$set: {token: ''}});
        return res.send(401, {
          status: 0,
          message: '无效token，请重新登录',
        });
      }
      // token 未过期 解析并存储 userId
      req.headers.userId = userId;
      process.nextTick(() => next());
    });
  }
}

module.exports = new CheckAuth();