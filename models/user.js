const mongodb = require('../mongodb/ndbc.js');

// 为users表创建索引
mongodb(async (db) => {
  try {
    const user_collection = db.collection('users');
    await user_collection.createIndex({_id: 1, id: 1, user_name: 1, token: 1});
    console.log('user_collection indexed success')
  } catch (error) {
    throw error;
  }
});

module.exports = class User {
  /**uuid @type string**/
  id = '';
  /**用户名 @type string**/
  user_name = '';
  /**密码 @type string**/
  password = '';
  /**注册日期时间戳 @type number**/
  create_time = -1;
  /**用户登录token @type string**/
  token = '';
  /**头像 @type string 头像id**/
  avatar = '';
  /**简介/签名 @type string**/
  introduction = '';
  /**性别 @type number 0:女 1:男 2:保密/未知**/
  gender = 2;
  /**生日 @type string yy-mm-dd**/
  birthday = '';
  /**当前城市 @type string**/
  current_city = '';
  /**听歌历史记录 @type number[] 歌曲id数组**/
  song_history = [];
  /**创建的歌单 @type number[] 歌单id数组**/
  song_collection = [];

  constructor(id, user_name, password, create_time) {
    this.id = id;
    this.user_name = user_name;
    this.password = password;
    this.create_time = create_time;
  }
};