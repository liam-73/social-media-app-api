const mongoose = require('mongoose');
const PostModel = require('./post.model');

const schema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  other_tagged_users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
});

module.exports = PostModel.discriminator('TAGGED_POST', schema);
