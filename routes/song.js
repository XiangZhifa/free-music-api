const Song = require('../controller/song.js');
const checkAuth = require('../middlewares/checkAuth.js');
const express = require('express');
const router = express.Router();

// 初始化数据 !!! 只需要调用一次该接口 !!! 请勿插入重复数据 !!!
// router.post('/initSongData', Song.initSongData);

// 根据所属榜单类型查询歌曲 参数为top=surge/new/original/hot/network 登录返回最新100首 未登录返回最新20首
router.get('/getSongByTop', Song.getSongByTop);

// 根据歌曲名称查询歌曲 需要分页 不登录无法调用该接口
router.get('/getSongByName', checkAuth.checkToken, Song.getSongByName);

// 根据歌手查询歌曲 需要分页 不登录无法调用该接口
router.get('/getSongBySinger', checkAuth.checkToken, Song.getSongBySinger);

// 根据专辑查询歌曲 需要分页 不登录无法调用该接口
router.get('/getSongByAlbum', checkAuth.checkToken, Song.getSongByAlbum);

// 根据歌曲id查询单曲信息
router.get('/getSongById', Song.getSongById);

module.exports = router;