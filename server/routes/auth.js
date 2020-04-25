const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

router.route('/signup').post(
  [
    body('email', 'Please enter a valid email.')
      .isEmail()
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) throw 'Email address already exists.';
      })
      .normalizeEmail(),
    body('password').trim().isLength({ min: 5 }),
    body('name').trim().not().isEmpty()
  ],
  authController.signup
);

router.route('/login').post(authController.login);

module.exports = router;
