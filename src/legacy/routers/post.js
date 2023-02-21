const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const router = new express.Router();

// schema
const Post = require('../models/post');
const Noti = require('../models/noti');
const User = require('../models/user');
const Group = require('../models/group');

// authentication
const auth = require('../authentication/auth');
const { authToken } = require('../authentication/generateToken');
const photoUpload = require('../modules/photo');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png'
  )
    cb(null, true);
  else cb(null, false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 30000000 } });

router.post('/posts', upload.single('image'), auth, async (req, res) => {
  if (req.file) {
    try {
      const image = await photoUpload(req.file);

      const post = await new Post({
        body: req.body.body,
        image,
        user: req.user._id,
      });

      if (req.body.group) post.group = req.body.group;

      if (req.body.tagFriends) {
        let tagFriends = req.body.tagFriends;

        if (typeof req.body.tagFriends === 'string') {
          tagFriends = new Array(tagFriends);
        }

        for (let i = 0; i < tagFriends.length; i++) {
          const user = await User.findById(
            mongoose.Types.ObjectId(tagFriends[i]),
          );

          if (!user) continue;

          post.tagFriends = post.tagFriends.concat({
            _id: user._id,
            name: user.name,
            avatar: user.avatar.url,
          });

          const notification = req.user.name + ' tagged you in a post.';

          const noti = await new Noti({
            user: user._id,
            notification,
          });

          await noti.save();
        }
      }

      await post.save();

      res.status(201).json(post);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  } else {
    try {
      const post = new Post({
        body: req.body.body,
        user: req.user._id,
      });

      if (req.body.group) {
        post.group = req.body.group;
      }

      if (req.body.tagFriends) {
        let tagFriends = req.body.tagFriends;

        if (typeof req.body.tagFriends === 'string') {
          tagFriends = new Array(tagFriends);
        }

        for (let i = 0; i < tagFriends.length; i++) {
          const user = await User.findById(
            mongoose.Types.ObjectId(tagFriends[i]),
          );

          if (!user) continue;

          post.tagFriends = post.tagFriends.concat({
            _id: user._id,
            name: user.name,
            avatar: user.avatar.url,
          });

          const notification = req.user.name + ' tagged you in a post.';

          const noti = await new Noti({
            user: mongoose.Types.ObjectId(tagFriends[i]),
            notification,
          });

          await noti.save();
        }
      }

      await post.save();
      res.status(201).json(post);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
});

router.get('/posts', auth, async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $match: {
          $or: [{ shared_user: req.user._id }, { user: req.user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
    ]);

    posts.forEach((post) => {
      post.liked_users.forEach((item) => {
        if (item.user.toString() === req.user._id.toString()) {
          post.is_liked = true;
        } else {
          post.is_liked = false;
        }
      });
    });

    res.json({ posts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/user_posts/:id', auth, async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $match: { user: mongoose.Types.ObjectId(req.params.id) },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
    ]);

    posts.forEach((post) => {
      if (post.liked_users.length > 0) {
        post.liked_users.forEach((item) => {
          if (item.user.toString() === req.user._id.toString()) {
            post.is_liked = true;
          } else {
            post.is_liked = false;
          }
        });
      } else {
        post.is_liked = false;
      }
    });

    res.json({ posts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/posts/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['body'];

  const validOperation = updates.every((item) => allowedUpdates.includes(item));

  if (!validOperation) return res.status(400).send();

  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) return res.status(404).send();

    updates.forEach((item) => (post[item] = req.body[item]));

    await post.save();
    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const task = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) throw new Error('Post not found!');

    res.json({ message: 'Post Deleted' });
  } catch (e) {
    if (e.message === 'Post not found!') {
      return res.status(404).json({ message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
});

router.get('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user');

    if (post.liked_users.length > 0) {
      post.liked_users.forEach((item) => {
        if (item.user.toString() === req.user._id.toString()) {
          post.is_liked = true;
        } else {
          post.is_liked = false;
        }
      });
    } else {
      post.is_liked = false;
    }

    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/all_posts', auth, async (req, res) => {
  try {
    let posts = await Post.aggregate([
      {
        $match: {
          user: { $ne: req.user._id },
          shared_user: { $ne: req.user._id },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
    ]);

    posts.forEach((post) => {
      if (req.user.blocked_users.length > 0) {
        req.user.blocked_users.forEach((user) => {
          if (user._id.toString() === post.user._id.toString()) {
            posts = posts.filter((item) => item !== post);
          }
        });
      }

      if (post.group) {
        posts = posts.filter((item) => item !== post);
      }

      if (post.shared_user) {
        posts = posts.filter((item) => item !== post);
      }

      if (post.liked_users.length > 0) {
        post.liked_users.forEach((item) => {
          if (item.user.toString() === req.user._id.toString()) {
            post.is_liked = true;
          } else {
            post.is_liked = false;
          }
        });
      } else {
        post.is_liked = false;
      }
    });

    res.json({ posts });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
});

router.post('/liked', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.body.post_id },
      { $inc: { likes: 1 } },
    );

    post.liked_users = await post.liked_users.concat({
      user: req.user._id,
      liked_at: new Date(),
    });

    post.liked_users.sort((a, b) =>
      a.liked_at > b.liked_at ? 1 : a.liked_at < b.liked_at ? -1 : 0,
    );

    await post.save();

    const notification = req.user.name + ' liked your post.';

    if (post.user.toString() !== req.user._id.toString()) {
      const noti = await new Noti({
        user: post.user._id,
        notification,
      });
      await noti.save();
    }

    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/unliked', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.body.post_id },
      { $inc: { likes: -1 } },
    );

    if (post.likes < 0) {
      post.likes = 0;
    }

    post.liked_users = post.liked_users.filter(
      (item) => item.user.toString() !== req.user._id.toString(),
    );

    await post.save();
    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/commented', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.body.post_id);

    if (!post) throw new Error('Post not found!');

    post.comments = await post.comments.concat({
      user: req.user._id,
      comment: req.body.comment,
      commented_at: new Date(),
    });

    post.comments.sort((a, b) =>
      a.commented_at > b.commented_at
        ? 1
        : a.commented_at < b.commented_at
        ? -1
        : 0,
    );

    await post.save();

    const notification = req.user.name + ' commented on your post.';

    if (post.user.toString() !== req.user._id.toString()) {
      const noti = await new Noti({
        user: req.user._id,
        notification,
      });
      await noti.save();
    }

    res.json(post);
  } catch (e) {
    if (e.message === 'Post not found!') {
      return res.status(404).json({ message: e.message });
    }
    res.status(500).json({ message: e.message });
  }
});

router.get('/group_posts/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    const isAdmin = group.admin.toString() === req.user._id.toString();

    let isMember = false;

    if (group.members.length > 0) {
      group.members.forEach((item) => {
        if (item._id.toString() === req.user._id.toString()) {
          isMember = true;
        }
      });
    }

    if (!isAdmin && !isMember) return res.status(401).send();

    const posts = await Post.aggregate([
      {
        $match: { group: mongoose.Types.ObjectId(req.params.id) },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]);

    posts.forEach((post) => {
      if (post.liked_users.length > 0) {
        post.liked_users.forEach((item) => {
          if (item.user.toString() === req.user._id.toString()) {
            post.is_liked = true;
          } else {
            post.is_liked = false;
          }
        });
      } else {
        post.is_liked = false;
      }
    });

    res.json({ posts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/tagged_posts', auth, async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $match: {
          'tagFriends._id': req.user._id,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    posts.forEach((post) => {
      if (post.liked_users.length > 0) {
        post.liked_users.forEach((item) => {
          if (item.user.toString() === req.user._id.toString()) {
            post.is_liked = true;
          } else {
            post.is_liked = false;
          }
        });
      } else {
        post.is_liked = false;
      }
    });

    res.json({ posts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/liked_users/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'liked_users.user',
    );

    res.json({ liked_users: post.liked_users });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/comments/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user');

    let comments = post.comments;

    req.user.blocked_users.forEach((user) => {
      comments = comments.filter(
        (item) => item.user._id.toString() !== user._id.toString(),
      );
    });

    res.json({ comments, count: comments.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/shared', auth, async (req, res) => {
  try {
    const original_post = await Post.findOneAndUpdate(
      { _id: req.body._id },
      { $inc: { shares: 1 } },
    ).populate('user');

    const shared_post = await new Post({
      user: original_post.user._id,
      body: original_post.body,
      image: original_post.image,
      shared_user: req.user._id,
    });

    const notification = req.user.name + ' shared your post.';

    if (original_post.user.toString() !== req.user._id.toString()) {
      const noti = await new Noti({
        user: req.user._id,
        notification,
      });

      await noti.save();
    }
    await shared_post.save();
    await original_post.save();

    res.json(shared_post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/shared_posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ shared_user: req.user._id })
      .populate('user')
      .populate('shared_user');

    posts.forEach((post) => {
      if (post.liked_users.length > 0) {
        post.liked_users.forEach((item) => {
          if (item.user.toString() === req.user._id.toString()) {
            post.is_liked = true;
          } else {
            post.is_liked = false;
          }
        });
      } else {
        post.is_liked = false;
      }
    });

    res.json({ posts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/all_groups_posts', auth, async (req, res) => {
  try {
    const groupsId = await Group.aggregate([
      {
        $match: {
          $or: [{ admin: req.user._id }, { 'members._id': req.user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    let allPosts = [];

    for (let i = 0; i < groupsId.length; i++) {
      const posts = await Post.aggregate([
        {
          $match: { group: groupsId[i]._id },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
      ]);
      allPosts = allPosts.concat(posts);
    }

    allPosts.forEach((post) => {
      if (post.liked_users.length > 0) {
        post.liked_users.forEach((item) => {
          if (item.user.toString() === req.user._id.toString()) {
            post = { ...post, is_liked: true };
          } else {
            post.is_liked = false;
          }
        });
      } else {
        post.is_liked = false;
      }
    });

    res.json({ posts: allPosts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
