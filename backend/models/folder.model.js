const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null // null means root folder
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    pin: {
        type: String,
        select: false,
        default: null // 4-digit PIN for private folders
    },
    pinHash: {
        type: String,
        select: false,
        default: null
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverImage: {
        type: String,
        default: '' // Will be extracted from first template
    }
}, {
    timestamps: true
});

// Index for faster queries
folderSchema.index({ author: 1, parentFolder: 1 });
folderSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Folder', folderSchema);
