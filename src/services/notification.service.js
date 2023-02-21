const NotificationModel = require('../models/notification.model');
const { NOTIFICATION_ERRORS } = require('../constants/error.constants');

module.exports = () => ({
  sentNotification: async (user, notification) =>
    await NotificationModel.create({ user, notification }),

  getNotifications: async (user) => {
    const [notifications, count] = Promise.all(
      await NotificationModel.find({ user }),
      await NotificationModel.countDocuments({ user }),
    );

    return { notifications, count };
  },

  readNotifications: async (notification_id) => {
    const notification = await NotificationModel.findById(notification_id);

    if (!notification) NOTIFICATION_ERRORS.NOTI_NOT_FOUND;

    return await NotificationModel.findByIdAndUpdate(notification_id, {
      is_read: true,
    });
  },
});
