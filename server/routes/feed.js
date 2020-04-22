const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const postValidation = [
  body('title').trim().isLength({ min: 5 }),
  body('content').trim().isLength({ min: 5 })
];

router.route('/posts').get(feedController.getPosts);

router.route('/post').post(postValidation, feedController.createPost);

router
  .route('/post/:postId')
  .get(feedController.getPost)
  .put(postValidation, feedController.updatePost)
  .delete(feedController.deletePost);

module.exports = router;
