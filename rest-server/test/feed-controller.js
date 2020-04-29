const expect = require('chai').expect;
const mongoose = require('mongoose');

require('dotenv').config();

const User = require('../models/user');
const Post = require('../models/post');
const feedController = require('../controllers/feed');

describe('Auth Controller', function () {
  before(function (done) {
    mongoose
      .connect(process.env.DEV_MONGODB_URI)
      .then(() => {
        const user = new User({
          email: 'test@test.com',
          password: 'password',
          name: 'Test',
          posts: [],
          _id: '5ea94443ae4a1c4840a47364'
        });
        return user.save();
      })
      .then(() => done())
      .catch(console.log);
  });

  it('should add a created post to the posts field of the user', function (done) {
    const req = {
      file: { path: 'abc' },
      body: {
        title: 'Test',
        content: 'Test'
      },
      userId: '5ea94443ae4a1c4840a47364'
    };
    const res = {
      status: function () {
        return this;
      },
      json: function () {}
    };

    feedController
      .createPost(req, res, () => {})
      .then(() => User.findById(req.userId))
      .then(user => {
        expect(user).to.have.property('posts');
        expect(user.posts).to.have.length(1);
        done();
      });
  });

  after(function (done) {
    User.deleteMany({})
      .then(() => mongoose.disconnect())
      .then(() => done());
  });
});
