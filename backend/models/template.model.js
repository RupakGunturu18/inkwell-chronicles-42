const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['blog', 'article', 'newsletter', 'report', 'other'],
        default: 'other'
    },
    content: {
        type: String,
        required: true,
        default: '<p>Start writing your template...</p>'
    },
    thumbnail: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null // null means not in any folder
    }
}, {
    timestamps: true
});

// Index for faster queries
templateSchema.index({ author: 1, createdAt: -1 });
templateSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Template', templateSchema);
