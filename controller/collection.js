const {v4: uuidv4} = require('uuid');
const mongodb = require('../mongodb/ndbc.js');
const Collection = require('../models/collection.js');

class CollectionController {
  // 用户新增歌单
  async addSongCollection(req, res, next) {
    const collection_params = req.body;
    if (!collection_params) {
      return res.send({
        status: 0,
        message: '传参格式错误'
      });
    }
    if (!collection_params.name) {
      return res.send({
        status: 0,
        message: '歌单名不能为空'
      });
    }
    try {
      mongodb(async (db) => {
        const user_id = req.headers.userId;
        const collections_collection = db.collection('collections');
        const collection_exist = await collections_collection.findOne({user_id, name: collection_params.name});
        if (collection_exist) {
          return res.send({
            status: 0,
            message: '该歌单已存在，请勿重复新增'
          });
        }
        const new_song_collection = new Collection(user_id, uuidv4(), collection_params.name, collection_params.decs || '', new Date().getTime());
        await collections_collection.insertOne(new_song_collection);
        return res.send({
          status: 1,
          message: '新增歌单成功'
        });
      })
    } catch (error) {
      console.error('新增歌单功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，新增歌单失败'
      });
    }
  }

  // 用户删除歌单
  async deleteSongCollection(req, res, next) {
    const collection_params = req.body;
    if (!collection_params) {
      return res.send({
        status: 0,
        message: '传参格式错误'
      });
    }
    if (!collection_params.id) {
      return res.send({
        status: 0,
        message: '歌单id不能为空'
      });
    }
    try {
      mongodb(async (db) => {
        const user_id = req.headers.userId;
        const collections_collection = db.collection('collections');
        const collection_exist = await collections_collection.findOne({user_id, id: collection_params.id});
        if (!collection_exist) {
          return res.send({
            status: 0,
            message: '该歌单不存在，无法删除'
          });
        }
        await collections_collection.deleteOne({user_id, id: collection_params.id});
        return res.send({
          status: 1,
          message: '删除歌单成功'
        });
      })
    } catch (error) {
      console.error('删除歌单功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，删除歌单失败'
      });
    }
  }

  // 用户更新歌单信息 (不包含更新歌曲)
  async updateCollectionInfo(req, res, next) {
    const collection_params = req.body;
    if (!collection_params) {
      return res.send({
        status: 0,
        message: '传参格式错误',
      });
    }
    if ((!collection_params.name && !collection_params.decs) || !collection_params.id) {
      return res.send({
        status: 0,
        message: '传参格式错误'
      });
    }
    try {
      mongodb(async (db) => {
        const user_id = req.headers.userId;
        const collections_collection = db.collection('collections');
        const collection_exist = await collections_collection.findOne({user_id, id: collection_params.id});
        if (!collection_exist) {
          return res.send({
            status: 0,
            message: '该歌单不存在，无法更新信息'
          });
        }
        await collections_collection.updateOne({user_id, id: collection_params.id}, {
          $set: {
            name: collection_params.name,
            decs: collection_params.decs,
            update_time: new Date().getTime()
          }
        }, {upsert: true});
        return res.send({
          status: 1,
          message: '更新歌单信息成功'
        });
      })
    } catch (error) {
      console.error('更新歌单信息功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，更新歌单信息失败'
      });
    }
  }

  // 获取歌单详情
  async getCollectionInfo(req, res, next) {
    const collection_params = req.query;
    if (!collection_params) {
      return res.send({
        status: 0,
        message: '传参格式错误'
      });
    }
    if (!collection_params.id) {
      return res.send({
        status: 0,
        message: '参数不能为空'
      });
    }
    try {
      mongodb(async (db) => {
        const user_id = req.headers.userId;
        const collections_collection = db.collection('collections');
        const collection_exist = await collections_collection.findOne({user_id, id: collection_params.id});
        if (!collection_exist) {
          return res.send({
            status: 0,
            message: '该歌单不存在'
          });
        }
        delete collection_exist._id;
        delete collection_exist.user_id;
        return res.send({
          status: 1,
          data: {
            collection: collection_exist
          },
          message: '获取歌单详情成功'
        });
      })
    } catch (error) {
      console.error('获取歌单详情功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，获取歌单详情失败'
      });
    }
  }

  // 向歌单中收藏新歌曲
  async updateCollectionSong(req, res, next) {
    const collection_params = req.body;
    if (!collection_params) {
      return res.send({
        status: 0,
        message: '传参格式错误'
      });
    }
    if (!collection_params.id || !collection_params.song_list || !collection_params.song_list.length) {
      return res.send({
        status: 0,
        message: '参数缺失'
      });
    }
    try {
      mongodb(async (db) => {
        const user_id = req.headers.userId;
        const collections_collection = db.collection('collections');
        const collection_exist = await collections_collection.findOne({user_id, id: collection_params.id});
        if (!collection_exist) {
          return res.send({
            status: 0,
            message: '该歌单不存在，无法收藏歌曲'
          });
        }
        const new_song_list = [...new Set(collection_exist.song_list.concat(collection_params.song_list.split(',')))];
        await collections_collection.updateOne({user_id, id: collection_params.id}, {
          $set: {
            song_list: new_song_list,
            update_time: new Date().getTime()
          }
        }, {upsert: true});
        return res.send({
          status: 1,
          message: '收藏歌曲成功'
        });
      })
    } catch (error) {
      console.error('歌单收藏新歌曲功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，歌单收藏新歌曲失败'
      });
    }
  }

  // 删除歌单中收藏的歌曲
  async deleteCollectionSong(req, res, next) {
    const collection_params = req.body;
    if (!collection_params) {
      return res.send({
        status: 0,
        message: '传参格式错误'
      });
    }
    if (!collection_params.id || !collection_params.song_list || !collection_params.song_list.length) {
      return res.send({
        status: 0,
        message: '参数缺失',
      });
    }
    try {
      mongodb(async (db) => {
        const user_id = req.headers.userId;
        const collections_collection = db.collection('collections');
        const collection_exist = await collections_collection.findOne({user_id, id: collection_params.id});
        if (!collection_exist) {
          return res.send({
            status: 0,
            message: '该歌单不存在，无法收藏歌曲'
          });
        }
        collection_params.song_list.split(',').forEach((songId) => {
          const exist_song_index = collection_exist.song_list.indexOf(songId);
          exist_song_index !== -1 ? collection_exist.song_list.splice(exist_song_index, 1) : null;
        });
        const new_song_list = [...new Set(collection_exist.song_list)];
        await collections_collection.updateOne({user_id, id: collection_params.id}, {
          $set: {
            song_list: new_song_list,
            update_time: new Date().getTime()
          }
        }, {upsert: true});
        return res.send({
          status: 1,
          message: '取消收藏歌曲成功'
        });
      })
    } catch (error) {
      console.error('取消收藏歌曲功能异常：', error);
      return res.send({
        status: 0,
        message: '系统异常，取消收藏歌曲失败'
      });
    }
  }
}

module.exports = new CollectionController();