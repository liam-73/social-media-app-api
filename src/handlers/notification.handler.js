const Joi = require('joi');
Joi.objectid = require('joi-objectid')(Joi);

const NotificationController = require('../controllers/notification.controller');

module.exports = () => ({
  getNotifications: async (req, res, next) => {
    try {
      const notifications = await NotificationController.getNotifications(
        req.user,
      );

      res.json(notifications);
    } catch (e) {
      next();
    }
  },

  readNotification: async (req, res, next) => {
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
      await NotificationController.readNotification(req.query.id);
    } catch (e) {
      next();
    }
  },
});
