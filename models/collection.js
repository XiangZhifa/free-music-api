const mongodb = require('../mongodb/ndbc.js');

// 为collections表创建索引
mongodb(async (db) => {
  try {
    const collections_collection = db.collection('collections');
    await collections_collection.createIndex({_id: 1, user_id: 1, id: 1, name: 1, update_time: 1});
    console.log('collections_collection indexed success')
  } catch (error) {
    throw error;
  }
});

module.exports = class Collection {
  /**歌单所属用户id @type string**/
  user_id = '';
  /**uuid @type string**/
  id = '';
  /**歌单名 @type string**/
  name = '';
  /**歌单简介 @type string**/
  decs = '';
  /**歌单中的歌曲 @type number[]**/
  song_list = [];
  /**歌单数据更新时间戳 @type number**/
  update_time = -1;

  constructor(user_id, id, name, decs, update_time) {
    this.user_id = user_id;
    this.id = id;
    this.name = name;
    this.decs = decs;
    this.update_time = update_time;
  }
};