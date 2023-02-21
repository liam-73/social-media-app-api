const router = require('express').Router();

const userRoutes = require('./routes/users.route');
const postRoutes = require('./routes/post.route');
const groupRoutes = require('./routes/group.route');
const notificationRoutes = require('./routes/notification.route');

module.exports = () => {
  router.use('/users', userRoutes);
  router.use('/posts', postRoutes);
  router.use('/groups', groupRoutes);
  router.use('/notifications', notificationRoutes);

  return router;
};
