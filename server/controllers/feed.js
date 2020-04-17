const { validationResult } = require('express-validator');

exports.getPosts = (req, res) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'first post',
        content: 'my first post',
        imageUrl: 'images/duck.jpg',
        creator: {
          name: 'Raymond'
        },
        createdAt: new Date()
      }
    ]
  });
};

exports.createPost = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({
      message: 'Validation failed!',
      errors: errors.array()
    });

  const { title, content } = req.body;

  res.status(201).json({
    message: 'Created Successfully!',
    post: {
      _id: new Date(),
      title,
      content,
      creator: { name: 'Raymond' },
      createdAt: new Date()
    }
  });
};
