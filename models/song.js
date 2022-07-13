const mongodb = require('../mongodb/ndbc.js');

// 为songs表创建索引
mongodb(async (db) => {
  try {
    const song_collection = db.collection('songs');
    await song_collection.createIndex({_id: 1, id: 1, name: 1, top: 1, update_time: 1});
    console.log('song_collection indexed success')
  } catch (error) {
    throw error;
  }
});

module.exports = class Song {
  /**歌曲id @type number**/
  id = -1;
  /**歌曲名称 @type string**/
  name = '';
  /**歌手 @type {id:number,name:string}[]**/
  singers = [];
  /**所属专辑 @type {id:number,name:string,coverPic:string}[]**/
  album = null;
  /**歌词 @type string**/
  lyric = '';
  /**所属榜单 @type string surge:飙升榜  new:新歌榜  original:原创榜 hot:热歌榜 network网络热歌榜**/
  top = '';
  /**歌曲数据更新时间戳 @type number**/
  update_time = -1;

  constructor(id, name, singers, album, lyric, top, update_time) {
    this.id = id;
    this.name = name;
    this.singers = singers;
    this.album = album;
    this.lyric = lyric;
    this.top = top;
    this.update_time = update_time
  }
};