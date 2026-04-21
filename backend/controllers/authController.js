const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key-change-this', {
        expiresIn: '7d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        // Create new user
        const user = await User.create({
            name,
            username,
            email,
            password
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: error.message || 'Server error during signup' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Find user by email or username
        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Account not found. Please sign up first!' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Login or signup with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Google token is required' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleId = payload?.sub;
        const email = payload?.email?.toLowerCase();
        const name = payload?.name || 'Google User';
        const profileImage = payload?.picture || '';

        if (!googleId || !email) {
            return res.status(400).json({ message: 'Invalid Google token payload' });
        }

        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (!user) {
            const baseUsername = (email.split('@')[0] || 'user')
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_')
                .slice(0, 16) || 'user';

            let username = baseUsername;
            let suffix = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}${suffix}`.slice(0, 20);
                suffix += 1;
            }

            user = await User.create({
                name,
                username,
                email,
                googleId,
                profileImage,
                password: undefined,
            });
        } else {
            if (!user.googleId) user.googleId = googleId;
            if (!user.profileImage && profileImage) user.profileImage = profileImage;
            if (!user.name && name) user.name = name;
            await user.save();
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio,
            },
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Google login failed' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with that email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpiry = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                html: `
          <h2>Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
            });

            res.json({ success: true, message: 'Password reset email sent' });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpiry = undefined;
            await user.save();

            console.error('Email error:', emailError);
            return res.status(500).json({ message: 'Error sending email. Please try again later.' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;

        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Check username availability
// @route   GET /api/auth/check-username/:username
// @access  Public
exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username.toLowerCase() });

        res.json({ available: !user });
    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Search users by username
// @route   GET /api/auth/search-users?q=username
// @access  Private
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' },
            _id: { $ne: currentUserId } // Exclude current user
        })
            .select('name username email')
            .limit(10);

        res.json({ users });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify JWT token middleware
// @access  Private
exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, username, bio, profileImage } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if username is being changed and if it's already taken
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username: username.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            user.username = username.toLowerCase();
        }

        // Update fields
        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        if (profileImage !== undefined) user.profileImage = profileImage;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Set new password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

