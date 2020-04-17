const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find();

    res.status(200).json({
      message: 'Fetched posts.',
      posts
    });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed!');
      error.statusCode = 422;
      throw error;
    }

    if (!req.file) {
      const error = new Error('No image provided.');
      error.statusCode = 422;
      throw error;
    }

    const { title, content } = req.body;
    const imageUrl = req.file.path.replace('\\', '/'); // replace is fix for windows
    const post = new Post({
      title,
      content,
      imageUrl,
      creator: { name: 'Raymond' }
    });
    const savedPost = await post.save();

    res.status(201).json({
      message: 'Created Successfully!',
      post: savedPost
    });
  } catch (err) {
    next(err);
  }
};

exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: 'Post fetched.',
      post
    });
  } catch (err) {
    next(err);
  }
};
