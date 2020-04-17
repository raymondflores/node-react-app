exports.getPosts = (req, res) => {
  res.status(200).json({
    posts: [
      {
        title: 'first post',
        content: 'my first post'
      }
    ]
  });
};

exports.createPost = (req, res) => {
  const { title, content } = req.body;
  // create post in db;
  res.status(201).json({
    message: 'Created Successfully!',
    posts: [{ id: new Date(), title, content }]
  });
};
