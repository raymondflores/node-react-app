const expect = require('chai').expect;
const mongoose = require('mongoose');

require('dotenv').config();

const User = require('../models/user');
const authController = require('../controllers/auth');

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

  it('should send a response with a valid user status for an existing user', function (done) {
    const req = {
      userId: '5ea94443ae4a1c4840a47364'
    };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      }
    };

    authController
      .getUserStatus(req, res, () => {})
      .then(() => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.userStatus).to.be.equal('I am new!');
        done();
      });
  });

  after(function (done) {
    User.deleteMany({})
      .then(() => mongoose.disconnect())
      .then(() => done());
  });
});
