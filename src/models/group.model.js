const mongoose = require('mongoose');

//schema
const Post = require('./post.model');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profile: {
      type: String,
    },
    description: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    members: [memberSchema],
    requested_members: [memberSchema],
  },
  {
    timestamps: true,
  },
);

groupSchema.pre('remove', async function (next) {
  const group = this;

  await Post.deleteMany({ group: group._id });
  next();
});

module.exports = mongoose.model('Group', groupSchema);
