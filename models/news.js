const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  name: String,
  content: String,
  pic: String,
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
});

module.exports = mongoose.model('News', newsSchema);
