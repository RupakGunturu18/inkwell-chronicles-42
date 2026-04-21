const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../controllers/authController');

// Routes
router.get('/', postController.getAllPosts);
router.get('/drafts', protect, postController.getUserDrafts);
router.get('/my-posts', protect, postController.getMyPosts);
router.get('/:id', protect, postController.getPostById);
router.post('/', protect, postController.createPost);
router.put('/:id', protect, postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

// Interactions
router.post('/:id/like', protect, postController.likePost);
router.post('/:id/comment', protect, postController.commentOnPost);

module.exports = router;
