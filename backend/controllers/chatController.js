const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        // Create message
        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content
        });

        // Find or create conversation
        const conversation = await Conversation.findOrCreate(senderId, receiverId);
        conversation.lastMessage = message._id;
        conversation.updatedAt = Date.now();
        await conversation.save();

        // Populate message with sender info
        await message.populate('sender', 'name username');
        await message.populate('receiver', 'name username');

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name username email')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await conv.getUnreadCount(userId);
                const otherUser = conv.participants.find(p => p._id.toString() !== userId);

                return {
                    _id: conv._id,
                    otherUser,
                    lastMessage: conv.lastMessage,
                    unreadCount,
                    updatedAt: conv.updatedAt
                };
            })
        );

        res.json({ conversations: conversationsWithUnread });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get messages with a specific user
// @route   GET /api/chat/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        })
            .populate('sender', 'name username')
            .populate('receiver', 'name username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Message.countDocuments({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        });

        res.json({
            messages: messages.reverse(), // Reverse to show oldest first
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark message as read
// @route   PUT /api/chat/read/:messageId
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findOne({
            _id: messageId,
            receiver: userId
        });

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        await message.markAsRead();

        res.json({ success: true, message });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark all messages from a user as read
// @route   PUT /api/chat/read-all/:userId
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;

        await Message.updateMany(
            {
                sender: otherUserId,
                receiver: currentUserId,
                read: false
            },
            { read: true }
        );

        res.json({ success: true, message: 'All messages marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Message.countDocuments({
            receiver: userId,
            read: false
        });

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
