const Joi = require('joi');
Joi.objectid = require('joi-objectid')(Joi);

const PostController = require('../controllers/post.controller');
const POST_TYPES = require('../constants/post-type.constants');

const createPost = async (req, res, next) => {
  const schema = Joi.object({
    image: Joi.string(),
    body: Joi.string(),
    tagFriends: Joi.array().items(
      Joi.object({ user: Joi.objectid().required() }),
    ),
    group: Joi.objectid(),
  }).min(1);

  const { error, value } = schema.validate(req.body);

  if (error)
    return res.status(400).json({
      code: 400,
      message: error.details[0].message,
    });

  try {
    const post = await PostController.createPost(req.user, value);

    res.status(201).json(post);
  } catch (e) {
    next();
  }
};

const getPosts = async (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().valid(...POST_TYPES),
  });

  const { error, value } = schema.validate(req.params);

  if (error)
    return res.status(400).json({
      code: 400,
      message: error.details[0].message,
    });

  try {
    const posts = await PostController.getPosts(req.user, req.body.type);

    res.json(posts);
  } catch (e) {
    next(e);
  }
};

const getPostById = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.objectid().required(),
  });

  const { error, value } = schema.validate(req.query);

  if (error)
    return res.status(400).json({
      code: 400,
      message: error.details[0].message,
    });

  try {
    const post = await PostController.getPostById(req.query.id);

    res.json(post);
  } catch (e) {
    next();
  }
};

const updatePost = async (req, res, next) => {
  const schema = Joi.object({
    query: Joi.object({
      id: Joi.objectid().required(),
    }),
    body: {
      image: Joi.string(),
      body: Joi.string(),
      tagFriends: Joi.array().items(Joi.object({ user: Joi.objectid() })),
      type: Joi.string()
        .valid('LIKE', 'UNLIKED', 'COMMENT', 'SHARE')
        .optional(),
      comment: Joi.when('type', {
        is: 'COMMENT',
        then: Joi.string().required(),
      }),
    },
  });

  const { error, value } = schema.validate(req);

  if (error)
    return res.status(400).json({
      code: 400,
      message: error.details[0].message,
    });

  try {
    await PostController.updatePost(req.user, req.query.id, req.body);
    res.end();
  } catch (e) {
    next();
  }
};

const deletePost = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.objectid().required(),
  });

  const { error, value } = schema.validate(req.query);

  if (error)
    return res.status(400).json({
      code: 400,
      message: error.details[0].message,
    });

  try {
    await PostController.deletePost(req.user, req.query.id);

    res.end();
  } catch (e) {
    next();
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};
