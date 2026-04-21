const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
    checkUsername,
    searchUsers,
    protect,
    getUserProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/check-username/:username', checkUsername);

// Protected routes
router.get('/search-users', protect, searchUsers);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
