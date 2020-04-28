const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../util/file');

module.exports = {
  createUser: async function ({ userInput }, req) {
    const { email, password, name } = userInput;
    const errors = [];

    if (!validator.isEmail(email))
      errors.push({ message: 'Email is not valid.' });
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    )
      errors.push({ message: 'Password is too short' });

    if (errors.length > 0) {
      const error = new Error('Invalid Input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('User exists already.');
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, name, password: hashedPassword });
    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('No user found.');
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect.');
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { token, userId: user._id.toString() };
  },
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const { title, content, imageUrl } = postInput;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 }))
      errors.push({ message: 'Title needs 5 min length.' });
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 }))
      errors.push({ message: 'Content needs 5 min length.' });

    if (errors.length > 0) {
      const error = new Error('Invalid Input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('Invalid user.');
      error.code = 401;
      throw error;
    }

    const post = new Post({ title, content, imageUrl, creator: user });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },
  posts: async function ({ page = 1 }, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator');

    return {
      posts: posts.map(post => ({
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      })),
      totalPosts
    };
  },
  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');

    if (!post) {
      const error = new Error('No post found.');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');

    if (!post) {
      const error = new Error('No post found.');
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not Authorized.');
      error.statusCode = 403;
      throw error;
    }

    const { title, imageUrl, content } = postInput;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 }))
      errors.push({ message: 'Title needs 5 min length.' });
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 }))
      errors.push({ message: 'Content needs 5 min length.' });

    if (errors.length > 0) {
      const error = new Error('Invalid Input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    post.title = title;
    if (postInput.imageUrl !== 'undefined') post.imageUrl = imageUrl;
    post.content = content;
    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id);

    if (!post) {
      const error = new Error('No post found.');
      error.code = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not Authorized.');
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();

    return true;
  },
  user: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('No user found.');
      error.code = 404;
      throw error;
    }

    return {
      ...user._doc,
      _id: user._id.toString()
    };
  },
  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error('User is not authenticated.');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('No user found.');
      error.code = 404;
      throw error;
    }

    user.status = status;
    await user.save();

    return {
      ...user._doc,
      _id: user._id.toString()
    };
  }
};
