const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const graphqlHttp = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');

require('dotenv').config();

const app = express();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().getTime()}-${file.originalname}`);
  }
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  )
    cb(null, true);
  else cb(null, false);
};

app.use(bodyParser.json());
app.use(multer({ storage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(auth);

app.put('/image', (req, res) => {
  if (!req.isAuth) throw new Error('Not authenticated');

  if (!req.file)
    return res.status(200).json({
      message: 'No file provided.'
    });

  const { oldPath } = req.body;
  if (oldPath) clearImage(oldPath);

  return res.status(200).json({
    message: 'File saved',
    filePath: req.file.path.replace('\\', '/') // fix for windows
  });
});

app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) return err;

      const { data, message, code } = err.originalError;
      return {
        message: message || 'An error occured.',
        status: code || 500,
        data
      };
    }
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode, message, data } = error;
  res.status(statusCode || 500).json({ message, data });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(8080);
  })
  .catch(err => console.log(err));
