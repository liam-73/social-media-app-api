const PostModel = require('../models/post.model');
const SharedPostModel = require('../models/shared-post.model');
const TaggedPostModel = require('../models/tagged-post.model');
const NotificationService = require('./notification.service');
const { POST_ERRORS } = require('../constants/error.constants');

const fieldsToPopulate = [
  { path: 'user' },
  { path: 'post' },
  { path: 'owner' },
];

const createPost = async (user, payload) => {
  const { tagFriends } = payload;

  if (tagFriends) {
    tagFriends.forEach((friend) => {
      const notification = `${user.name} tagged you in a post.`;

      NotificationService.sentNotification(friend.user, notification);
    });
  }

  return await PostModel.create({ user, ...payload });
};

const getPostsByUserId = async (user_id) => {
  const [posts, count] = Promise.all(
    await PostModel.find({ user: user_id })
      .sort('-createdAt')
      .populate(fieldsToPopulate),
    await PostModel.countDocuments({ user: user_id }),
  );

  return { posts, count };
};

const getTaggedPosts = async (user_id) => {
  const [posts, count] = Promise.all(
    await TaggedPostModel.find({ user: user_id })
      .sort('-createdAt')
      .populate(fieldsToPopulate),
    await TaggedPostModel.countDocuments({ user: user_id }),
  );

  return { posts, count };
};

const getSharedPosts = async (user_id) => {
  const [posts, count] = Promise.all(
    await SharedPostModel.find({ user: user_id })
      .sort('-createdAt')
      .populate(fieldsToPopulate),
    await SharedPostModel.countDocuments({ user: user_id }),
  );

  return { posts, count };
};

const getAllPosts = async () => {
  const [posts, count] = Promise.all(
    await PostModel.find().sort('-createdAt').populate(fieldsToPopulate),
    await PostModel.countDocuments(),
  );

  return { posts, count };
};

const getPostById = async (post_id) => {
  const post = await PostModel.findById(post_id).populate(fieldsToPopulate);

  if (!post) throw POST_ERRORS.POST_NOT_FOUND;

  return post;
};

const updatePost = async (user, post_id, payload) => {
  const post = await PostModel.findById(post_id);

  if (!post) throw POST_ERRORS.POST_NOT_FOUND;

  if (post.user != user._id) throw POST_ERRORS.NOT_OWNER;

  return await PostModel.findByIdAndUpdate(post_id, payload);
};

const manageLike = async (user, post_id, type) => {
  const post = await PostModel.findById(post_id);

  if (!post) throw POST_ERRORS.POST_NOT_FOUND;

  if (type == 'LIKE') {
    post.liked_users = await post.liked_users.concat({
      user: user._id,
    });

    const notification = `${user.name} liked your post.`;

    NotificationService.sentNotification(post.user, notification);
  } else {
    post.liked_users = await post.liked_users.remove({
      user: user._id,
    });
  }
  return await post.save();
};

const commentPost = async (user, post_id, comment) => {
  const post = await PostModel.findById(post_id);

  if (!post) throw POST_ERRORS.POST_NOT_FOUND;

  post.comments = await post.comments.concat({
    user: user._id,
    comment,
  });

  const notification = `${user.name} commented on your post.`;

  NotificationService.sentNotification(post.user, notification);

  return await post.save();
};

const sharePost = async (user, post_id) => {
  const post = await PostModel.findById(post_id);

  if (!post) throw POST_ERRORS.POST_NOT_FOUND;

  const shared_post = await SharedPostModel.create({
    owner: post.user,
    user: user._id,
    post: post_id,
  });

  const notification = `${user.name} shared your post.`;

  NotificationService.sentNotification(post.user, notification);

  return shared_post;
};

const deletePost = async (post_id) => {
  const post = await PostModel.findById(post_id);

  if (!post) throw POST_ERRORS.POST_NOT_FOUND;

  if (post.user != user._id && post.owner != user._id)
    throw POST_ERRORS.NOT_OWNER;

  return await PostModel.findByIdAndDelete(post_id);
};

module.exports = {
  createPost,
  getPostsByUserId,
  getTaggedPosts,
  getSharedPosts,
  getAllPosts,
  getPostById,
  updatePost,
  manageLike,
  commentPost,
  sharePost,
  deletePost,
};
