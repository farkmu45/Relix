const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const newsData = require('./models/news');
const commentData = require('./models/comments');

mongoose.connect(
  'mongodb://localhost:27017/relix',
  { useNewUrlParser: true }
);

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
  newsData.find({}, (err, data) => {
    if (err) {
      res.send('Error 404');
    } else {
      res.render('index', { data: data });
    }
  });
});

app.get('/new', (req, res) => {
  res.render('new');
});

app.get('/news/:id', (req, res) => {
  newsData
    .findById(req.params.id)
    .populate('comments')
    .exec((err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.render('news', { foundNews: data });
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

app.get('/news/:news_id/edit', (req, res) => {
  newsData.findById(req.params.news_id, (err, foundData) => {
    if (err) {
      res.send(err);
    } else {
      res.render('edit', { foundData: foundData });
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

app.get('/s', (req, res) => {
  newsData.find({ name: new RegExp(req.query.search, 'i') }, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
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
              res.redirect(`/news/${req.params.news_id}`);
            }
          }
        );
      }
    }
  );
});

app.get('*', (req, res) => {
  res.send('Error 404');
});

app.listen(3000, () => {
  console.log(`Server started on 3000`);
});
