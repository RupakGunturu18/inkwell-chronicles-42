const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    checkUsername,
    searchUsers,
    protect
} = require('../controllers/authController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/check-username/:username', checkUsername);

// Protected routes
router.get('/search-users', protect, searchUsers);

module.exports = router;
