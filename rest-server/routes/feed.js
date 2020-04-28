const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const isAuth = require('../middleware/is-auth');
const feedController = require('../controllers/feed');
const postValidation = [
  body('title').trim().isLength({ min: 5 }),
  body('content').trim().isLength({ min: 5 })
];

router.route('/posts').get(isAuth, feedController.getPosts);

router.route('/post').post(isAuth, postValidation, feedController.createPost);

router
  .route('/post/:postId')
  .get(isAuth, feedController.getPost)
  .put(isAuth, postValidation, feedController.updatePost)
  .delete(isAuth, feedController.deletePost);

module.exports = router;
