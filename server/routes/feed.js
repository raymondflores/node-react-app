const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const feedController = require('../controllers/feed');

router
  .route('/posts')
  .get(feedController.getPosts)
  .post(
    [
      body('title').trim().isLength({ min: 5 }),
      body('content').trim().isLength({ min: 5 })
    ],
    feedController.createPost
  );

module.exports = router;
