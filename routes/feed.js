const express = require('express');
const router = express.Router();

const feedController = require('../controllers/feed');

router
  .route('/posts')
  .get(feedController.getPosts)
  .post(feedController.createPost);

module.exports = router;
