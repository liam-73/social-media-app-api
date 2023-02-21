const router = require('express').Router();

const authentication = require('../middlewares/authenticate.middleware');
const upload = require('../middlewares/upload.middleware');
const groupHandler = require('../handlers/group.handler');

module.exports = () => {
  router.use(authentication);

  router.post('/', upload.single('avatar'), groupHandler.createGroup);

  router.get('/', groupHandler.getGroups);

  router.get('/:id', groupHandler.getGroupById);

  router.patch('/:id', upload.single('avatar'), groupHandler.updateGroup);

  router.delete('/:id', groupHandler.deleteGroup);

  return router;
};
