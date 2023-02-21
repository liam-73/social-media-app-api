const Joi = require('joi');
Joi.objectid = require('joi-objectid')(Joi);
const groupController = require('../controllers/group.controller');

module.exports = () => ({
  createGroup: async (req, res, next) => {
    const schema = Joi.object({
      name: Joi.string().required(),
      avatar: Joi.string(),
      description: Joi.string(),
    });

    const { error, value } = schema.validate(req.body);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const group = await GroupController.createGroup(req.user, value);

      res.status(201).json(group);
    } catch (e) {
      next();
    }
  },

  getGroups: async (req, res, next) => {
    const schema = Joi.object({
      search: Joi.string(),
    });

    const { error, value } = schema.validate(req.body);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const groups = await GroupController.getGroups(value);

      res.json(groups);
    } catch (e) {
      next();
    }
  },

  getGroupById: async (req, res, next) => {
    const schema = Joi.object({
      id: Joi.objectid().required(),
    });

    const { error, value } = schema.validate(req.body);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      const group = await GroupController.getGroupById(value);

      res.json(group);
    } catch (e) {
      next();
    }
  },

  updateGroup: async (req, res, next) => {
    const schema = Joi.object({
      query: Joi.object({
        id: Joi.objectid().required(),
      }),
      body: Joi.object({
        name: Joi.string(),
        avatar: Joi.string(),
        description: Joi.string(),
        accepted_member: Joi.objectid(),
        removed_member: Joi.objectid(),
        rejected_member_request: Joi.objectid(),
      }),
    });

    const { error, value } = schema.validate(req);

    if (error)
      return res.status(400).json({
        code: 400,
        message: error.details[0].message,
      });

    try {
      await GroupController.updateGroup(req.user, req.query.id, req.body);

      res.end();
    } catch (e) {
      next();
    }
  },

  deleteGroup: async (req, res, next) => {
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
      await GroupController.deleteGroup(req.query.id);

      res.end();
    } catch (e) {
      next();
    }
  },
});
