const mongodb = require('../mongodb/ndbc.js');
const Song = require('../models/song.js');
const songs = require('../public/json/song.js');

class SongController {
  // 初始化数据 !!! 只需要调用一次该接口 !!! 请勿插入重复数据 !!!
  // 根据 ../public/json/song.js 初始化歌曲数据
  async initSongData(req, res, next) {
    try {
      const initData = songs.map((song) => {
        return new Song(song.id, song.name, song.singers, song.album, song.lyric, song.top, new Date().getTime());
      });
      let no_repeat_songs = [];
      let song_ids = [];
      // 将歌曲去重
      for (let song of initData) {
        if (song_ids.indexOf(song.id) === -1) {
          song_ids.push(song.id);
          no_repeat_songs.push(song);
        }
      }
      mongodb(async (db) => {
        const song_collection = db.collection('songs');
        await song_collection.insertMany(no_repeat_songs);
        res.send({
          status: 1,
          message: `初始化${no_repeat_songs.length}首歌曲成功`,
        })
      })
    } catch (err) {
      console.error('初始化歌曲失败', err);
      res.send({
        status: 0,
        message: '系统异常，初始化歌曲失败',
      })
    }
  }

  // 根据所属榜单类型查询歌曲 参数为top=surge/new/original/hot/network 登录返回全部歌曲 未登录返回最新20首
  async getSongByTop(req, res, next) {
    if (!req.query.top) return res.send({
      status: 0,
      message: '参数不能为空，获取歌曲榜单失败',
    });
    try {
      const access_success = req.headers.authorization.includes('IV') && req.headers.authorization.length === 134;
      mongodb(async (db) => {
        const song_collection = db.collection('songs');
        const all_top_song = await song_collection.find({top: req.query.top}).sort({update_time: -1}).toArray();
        const song_list = access_success ? all_top_song.slice(0, 100).map(song => {
          delete song._id;
          return song
        }) : all_top_song.slice(0, 20).map(song => {
          delete song._id;
          return song
        });
        res.send({
          status: 1,
          data: {
            songs: song_list
          },
          message: '获取歌曲榜单成功'
        })
      })
    } catch (err) {
      console.error('获取歌曲榜单失败', err);
      res.send({
        status: 0,
        message: '系统异常，获取歌曲榜单失败',
      })
    }
  }

  // 根据歌曲名称查询歌曲 需要分页 不登录无法调用该接口
  async getSongByName(req, res, next) {
    if (!req.query.name) return res.send({
      status: 0,
      message: '参数不能为空，获取歌曲失败',
    });
    try {
      const limit = +req.query.limit || 10;
      let offset = (+req.query.page - 1 || 0) * limit;
      mongodb(async (db) => {
        const song_collection = db.collection('songs');
        const all_filter_song = await song_collection.find({name: {$regex: new RegExp(req.query.name)}}).sort({update_time: -1}).toArray();
        const song_list = all_filter_song.map((song) => {
          delete song._id;
          return song
        }).slice(offset, offset + limit);
        res.send({
          status: 1,
          data: {
            songs: song_list
          },
          message: '获取歌曲成功'
        })
      });
    } catch (err) {
      console.error('获取歌曲失败', err);
      res.send({
        status: 0,
        message: '系统异常，获取歌曲失败',
      })
    }
  }

  // 根据歌手查询歌曲 需要分页 不登录无法调用该接口
  async getSongBySinger(req, res, next) {
    if (!req.query.singer) return res.send({
      status: 0,
      message: '参数不能为空，获取歌曲失败',
    });
    try {
      const limit = +req.query.limit || 10;
      let offset = (+req.query.page - 1 || 0) * limit;
      mongodb(async (db) => {
        const song_collection = db.collection('songs');
        const all_filter_song = await song_collection.find({'singers.name': req.query.singer}).sort({update_time: -1}).toArray();
        const song_list = all_filter_song.map((song) => {
          delete song._id;
          return song
        }).slice(offset, offset + limit);
        res.send({
          status: 1,
          data: {
            songs: song_list
          },
          message: '获取歌曲成功'
        })
      });
    } catch (err) {
      console.error('获取歌曲失败', err);
      res.send({
        status: 0,
        message: '系统异常，获取歌曲失败',
      })
    }
  }

  // 根据专辑查询歌曲 需要分页 不登录无法调用该接口
  async getSongByAlbum(req, res, next) {
    if (!req.query.album) return res.send({
      status: 0,
      message: '参数不能为空，获取歌曲失败',
    });
    try {
      const limit = +req.query.limit || 10;
      let offset = (+req.query.page - 1 || 0) * limit;
      mongodb(async (db) => {
        const song_collection = db.collection('songs');
        const all_filter_song = await song_collection.find({'album.name': req.query.album}).sort({update_time: -1}).toArray();
        const song_list = all_filter_song.map((song) => {
          delete song._id;
          return song
        }).slice(offset, offset + limit);
        res.send({
          status: 1,
          data: {
            songs: song_list
          },
          message: '获取歌曲成功'
        })
      });
    } catch (err) {
      console.error('获取歌曲失败', err);
      res.send({
        status: 0,
        message: '系统异常，获取歌曲失败',
      })
    }
  }

  // 根据歌曲id查询单曲信息
  async getSongById(req, res, next) {
    if (!req.query.id) return res.send({
      status: 0,
      message: '参数不能为空，获取歌曲失败',
    });
    try {
      mongodb(async (db) => {
        const song_collection = db.collection('songs');
        const song = await song_collection.findOne({id: +req.query.id});
        res.send({
          status: 1,
          data: {
            song
          },
          message: '获取歌曲成功'
        })
      })
    } catch (err) {
      console.error('获取歌曲失败', err);
      res.send({
        status: 0,
        message: '系统异常，获取歌曲失败',
      })
    }
  }
}

module.exports = new SongController();