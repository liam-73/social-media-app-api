const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Post = require('../models/post');

const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
    },

    profile: String,
    cover: String,
    dateOfBirth: String,
    hometown: String,
    bio: String,

    friend_requests: [friendSchema],

    friends: [friendSchema],

    blocked_users: [friendSchema],

    not_interested_users: [friendSchema],
  },
  {
    timestamps: true,
  },
);

userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'user',
});

userSchema.virtual('groups', {
  ref: 'Group',
  localField: '_id',
  foreignField: 'admin',
});

userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('remove', async function (next) {
  const user = this;
  await Post.deleteMany({ user: user._id });
  next();
});

userSchema.methods.AuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
