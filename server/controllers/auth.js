const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed!');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const { email, name, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, name, password: hashedPassword });
    const savedUser = await user.save();

    res.status(201).json({
      message: 'User created',
      userId: savedUser._id
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('User could not be found.');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordEqual = await bcrypt.compare(password, user.password);
    if (!isPasswordEqual) {
      const error = new Error('Wrong password.');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      userId: user._id.toString()
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ status: user.status });
  } catch (err) {
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    user.status = status;
    await user.save();

    res.status(200).json({ message: 'User updated.' });
  } catch (err) {
    next(err);
  }
};
