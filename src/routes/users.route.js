const router = require('express').Router();

const authenticate = require('../middlewares/authenticate.middleware');
const userHandler = require('../handlers/user.handler');
const upload = require('../middlewares/upload.middleware');

module.exports = () => {
  router.post('/', upload.single('avatar'), userHandler.createUser);

  router.post('/login', userHandler.login);

  router.use(authenticate);

  router.get('/', userHandler.getUsers);

  router.get('/profile', userHandler.getProfile);

  router.patch('/', upload.single('avatar'), userHandler.updateUser);

  router.get('/:id', userHandler.getUserById);

  router.get('/friends', userHandler.getFriends);

  router.patch('/friends', userHandler.updateFriends);

  router.get('/friend_requests', userHandler.getFriendRequests);

  router.post('/friend_requests', userHandler.sentFriendRequest);

  router.patch('/friend_requests', userHandler.handleFriendRequests);

  router.get('/blocked_users', userHandler.getBlockedUsers);

  router.get('/groups', userHandler.getUserGroups);

  router.post('/groups/:id', userHandler.requestToJoinGroup);

  router.delete('/', userHandler.deleteUser);

  return router;
};
