const express = require('express');
const authentication = require('../../src/middlewares/authenticate.middleware');
const upload = require('../../src/middlewares/upload.middleware');
const PostHandler = require('../handlers/post.handler');

const router = new express.Router();

router.use(authentication);

router.post('/', upload.single('image'), PostHandler.createPost);

router.get('/', PostHandler.getPosts);

router.get('/:id', PostHandler.getPostById);

router.patch('/:id', upload.single('image'), PostHandler.updatePost);

router.delete('/:id', PostHandler.deletePost);

module.exports = router;
