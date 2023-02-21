const NotificationService = require('../services/notification.service');

module.exports = () => ({
  getNotifications: async (user) =>
    await NotificationService.getNotifications(user._id),

  readNotification: async (notification_id) =>
    await NotificationService.readNotification(notification_id),
});
