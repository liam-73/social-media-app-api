const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    body: String,

    image: String,

    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    tagFriends: [friendSchema],

    likes: {
      type: Number,
      default: 0,
    },

    liked_users: [friendSchema],

    comments: [commentSchema],

    shares: {
      type: Number,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Post', postSchema, 'posts');
