const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for fast participant lookup
conversationSchema.index({ participants: 1 });

// Ensure exactly 2 participants
conversationSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        next(new Error('Conversation must have exactly 2 participants'));
    } else {
        next();
    }
});

// Method to get unread count for a specific user
conversationSchema.methods.getUnreadCount = async function (userId) {
    const Message = mongoose.model('Message');
    const count = await Message.countDocuments({
        receiver: userId,
        sender: { $in: this.participants.filter(p => p.toString() !== userId.toString()) },
        read: false
    });
    return count;
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function (user1Id, user2Id) {
    let conversation = await this.findOne({
        participants: { $all: [user1Id, user2Id] }
    });

    if (!conversation) {
        conversation = await this.create({
            participants: [user1Id, user2Id]
        });
    }

    return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
