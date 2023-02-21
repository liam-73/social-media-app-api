const PostService = require('../services/post.service');

const createPost = async (user, payload) =>
  await PostService.createPost(user, payload);

const getPosts = async (user, type) => {
  if (type == 'USER_POSTS') {
    return await PostService.getPostsByUserId(user._id);
  } else if (type == 'TAGGED_POSTS') {
    return await PostService.getTaggedPosts(user._id);
  } else if (type == 'SHARED_POSTS') {
    return await PostService.getSharedPosts(user._id);
  } else {
    return await PostService.getAllPosts(user._id);
  }
};

const getPostById = async (post_id) => await PostService.getPostById(post_id);

const updatePost = async (user, post_id, payload) => {
  const { type } = payload;

  if (type) {
    if (type == 'LIKE' || type == 'UNLIKE')
      return await PostService.manageLike(user, post_id, type);

    if (type == 'COMMENT')
      return await PostService.commentPost(user, post_id, payload.comment);

    if (type == 'SHARE') return await PostService.sharePost(user, post_id);
  }

  return await PostService.updatePost(user, post_id, payload);
};

const deletePost = async (user, post_id) =>
  await PostService.deletePost(post_id);

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};
