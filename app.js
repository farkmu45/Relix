const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const newsData = require('./models/news');
const commentData = require('./models/comments');

mongoose.connect('mongodb://localhost/relix');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/photos');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  newsData
    .find({})
    .populate('comments')
    .exec((err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.render('home', { data: data });
      }
    });
});

app.post('/news', upload.single('thumbnail'), (req, res) => {
  newsData.create(
    {
      name: req.body.dataname,
      content: req.body.datacontent,
      pic: `/photos/${req.file.filename}`
    },
    err => {
      if (err) {
        res.send(err);
      } else {
        res.redirect('/');
      }
    }
  );
});

app.get('/news/:news_id', (req, res) => {
  newsData.findById(req.params.news_id, (err, foundData) => {
    if (err) {
      res.send(err);
    } else {
      res.render('update', { foundData: foundData });
    }
  });
});

app.put('/news/:news_id', (req, res) => {
  newsData.findByIdAndUpdate(req.params.news_id, req.body.data, err => {
    if (err) {
      res.send(err);
    } else {
      res.redirect('/');
    }
  });
});

app.delete('/news/:news_id', (req, res) => {
  newsData.findById(req.params.news_id, (err, news) => {
    if (err) {
      res.send(err);
    } else {
      if (news.comments) {
        news.comments.forEach(item => {
          commentData.findByIdAndRemove(item._id, err => {
            if (err) {
              res.send(err);
            }
          });
        });
      }
      newsData.findByIdAndRemove(req.params.news_id, err => {
        if (err) {
          res.send(err);
        } else {
          res.redirect('/');
        }
      });
    }
  });
});

app.get('/news?search', (req, res) => {
  newsData.find({ name: new RegExp(/ req.query.search /i) }, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.render('found', { result: result });
    }
  });
});

app.post('/comment/:news_id', (req, res) => {
  commentData.create(
    { user: req.body.username, text: req.body.comment_text },
    (err, commentData) => {
      if (err) {
        res.send(err);
      } else {
        newsData.findByIdAndUpdate(
          req.params.news_id,
          { $push: { comments: commentData } },
          err => {
            if (err) {
              console.log(err);
            } else {
              res.redirect('/');
            }
          }
        );
      }
    }
  );
});

app.listen(3000, () => {
  console.log(`Server started on 3000`);
});
