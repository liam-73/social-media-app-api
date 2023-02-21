const router = require('express').Router();

const NotificationHandler = require('../handlers/notification.handler');
const authentication = require('../middlewares/authenticate.middleware');

module.exports = () => {
  router.use(authentication);

  router.get('/', NotificationHandler.getNotifications);

  router.patch('/:id', NotificationHandler.readNotification);

  return router;
};
