const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const {
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} = require('../controllers/chatController');

// All chat routes are protected
router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/messages/:userId', protect, getMessages);
router.put('/read/:messageId', protect, markAsRead);
router.put('/read-all/:userId', protect, markAllAsRead);
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;
