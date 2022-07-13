const Collection = require('../controller/collection.js');
const checkAuth = require('../middlewares/checkAuth.js');
const express = require('express');
const router = express.Router();

router.post('/addSongCollection', checkAuth.checkToken, Collection.addSongCollection);

router.delete('/deleteSongCollection', checkAuth.checkToken, Collection.deleteSongCollection);

router.put('/updateCollectionInfo', checkAuth.checkToken, Collection.updateCollectionInfo);

router.get('/getCollectionInfo', checkAuth.checkToken, Collection.getCollectionInfo);

router.post('/updateCollectionSong', checkAuth.checkToken, Collection.updateCollectionSong);

router.delete('/deleteCollectionSong', checkAuth.checkToken, Collection.deleteCollectionSong);

module.exports = router;