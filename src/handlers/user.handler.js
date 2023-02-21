const Joi = require('joi');
Joi.objectid = require('joi-objectid')(Joi);

const userController = require('../controllers/user.controller');

module.exports = () => ({
  createUser: async (req, res, next) => {
    const schema = Joi.object({
      avatar: Joi.string(),
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      date_of_birth: Joi.string(),
      address: Joi.string(),
      bio: Joi.string(),
    });

    const { error, value } = schema.validate(req.body);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const user = await userController.createUser(value);

      res.json(user);
    } catch (e) {
      next();
    }
  },

  login: async (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const user = await userController.login(value);

      res.json(user);
    } catch (e) {
      next();
    }
  },

  getUsers: async (req, res, next) => {
    const schema = Joi.object({
      search: Joi.string(),
    });

    const { error, value } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ code: 400, message: error.details[0].message });

    try {
      const { data, count } = await userController.getUsers(value);
      res.json({ data, count });
    } catch (e) {
      next();
    }
  },

  getProfile: async (req, res, next) => {
    try {
      res.json(req.user);
    } catch (e) {
      next();
    }
  },

  updateUser: async (req, res, next) => {
    const schema = Joi.object({
      avatar: Joi.string(),
      name: Joi.string(),
      date_of_birth: Joi.string(),
      address: Joi.string(),
      bio: Joi.string(),
      avatar_url: Joi.string(),
    });

    const { error, value } = schema.validate(req.body);

    if (error)
      return res
        .status(400)
        .json({ code: 400, message: error.details[0].message });

    try {
      const user = await userController.updateUser(req.user, value);

      res.json(user);
    } catch (e) {
      next();
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      await req.user.remove();
      res.json({ message: 'User deleted!' });
    } catch (e) {
      next();
    }
  },

  getUserById: async (req, res) => {
    const schema = Joi.object({
      id: Joi.objectid().required(),
    });

    const { error, value } = schema.validate(req.query);

    if (error)
      return res
        .status(400)
        .json({ code: 400, message: error.details[0].message });

    try {
      const user = await userController.getUserById(value);

      res.json(user);
    } catch (e) {
      if (e.message === 'you must provide user id in query.') {
        return res.status(400).json({ message: e.message });
      } else {
        return res.status(500).json({ message: e.message });
      }
    }
  },

  sentFriendRequest: async (req, res, next) => {
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
      await userController.sentFriendRequest(req.user, value);

      res.end();
    } catch (e) {
      next();
    }
  },

  getFriendRequests: async (req, res, next) => {
    try {
      const data = await userController.getFriendRequests(req.user);

      res.json(data);
    } catch (e) {
      next();
    }
  },

  updateFriendRequests: async (req, res, next) => {
    const schema = Joi.object({
      query: { id: Joi.objectid().required() },
      body: { is_remove: Joi.boolean().default(false) },
    });

    const { error, value } = schema.validate(req);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      await userController.updateFriendRequests(
        req.user,
        req.query.id,
        req.body.is_remove,
      );

      res.end();
    } catch (e) {
      next();
    }
  },

  getFriends: async (req, res, next) => {
    const schema = Joi.object({
      search: Joi.string(),
    });

    const { error, value } = schema.validate(req.query);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const friends = await userController.getFriends(req.user, value);

      res.json(friends);
    } catch (e) {
      next();
    }
  },

  getMutualFriends: async (req, res, next) => {
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
      const mutual_friends = await userController.getMutualFriends(
        req.user,
        value,
      );

      res.json(mutual_friends);
    } catch (e) {
      next();
    }
  },

  updateFriends: async (req, res, next) => {
    const schema = Joi.object({
      query: { id: Joi.objectid().required() },
      body: {
        type: Joi.string().valid('UNFRIEND', 'BLOCK', 'UNBLOCK').required(),
      },
    });

    const { error, value } = schema.validate(req);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      await userController.updateFriends(req.user, value.query, value.body);

      res.end();
    } catch (e) {
      next();
    }
  },

  getBlockedUsers: async (req, res, next) => {
    try {
      const users = await userController.getBlockedUsers(req.user);

      res.json({ users });
    } catch (e) {
      next();
    }
  },

  getUserGroups: async (req, res, next) => {
    const schema = Joi.object({
      are_own_groups: Joi.boolean().default(false),
    });

    const { error, value } = schema.validate(req.params);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const groups = await userController.getUserGroups(
        req.user,
        req.params.are_own_groups,
      );

      res.json(groups);
    } catch (e) {
      next();
    }
  },

  requestToJoinGroup: async (req, res, next) => {
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
      await userController.requestToJoinGroup(req.user, req.query.id);

      res.end();
    } catch (e) {
      next();
    }
  },
});
