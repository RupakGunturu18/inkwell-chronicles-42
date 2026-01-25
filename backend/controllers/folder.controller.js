const Folder = require('../models/folder.model');
const Template = require('../models/template.model');

// Get all folders for a user (with hierarchy)
exports.getAllFolders = async (req, res) => {
    try {
        const folders = await Folder.find({ author: req.user.id })
            .populate('parentFolder', 'name')
            .sort({ createdAt: -1 });
        res.json(folders);
    } catch (error) {
        console.error('Error in getAllFolders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get folders by parent (for nested navigation)
exports.getFoldersByParent = async (req, res) => {
    try {
        const { parentId } = req.params;
        const parentFolder = parentId === 'root' ? null : parentId;

        const folders = await Folder.find({
            author: req.user.id,
            parentFolder: parentFolder
        }).sort({ createdAt: -1 });

        res.json(folders);
    } catch (error) {
        console.error('Error in getFoldersByParent:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single folder with templates
exports.getFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id)
            .populate('parentFolder', 'name');

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Check ownership for private folders
        if (!folder.isPublic && folder.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get templates in this folder
        const templates = await Template.find({ folder: folder._id })
            .sort({ createdAt: -1 });

        // Get subfolders
        const subfolders = await Folder.find({ parentFolder: folder._id })
            .sort({ createdAt: -1 });

        res.json({
            folder,
            templates,
            subfolders
        });
    } catch (error) {
        console.error('Error in getFolder:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create folder
exports.createFolder = async (req, res) => {
    try {
        const { name, description, parentFolder, isPublic, pin } = req.body;

        // Validate PIN if folder is private
        if (!isPublic && pin) {
            if (!/^\d{4}$/.test(pin)) {
                return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
            }
        }

        // If parentFolder is provided, verify it exists and user owns it
        if (parentFolder && parentFolder !== 'root') {
            const parent = await Folder.findById(parentFolder);
            if (!parent || parent.author.toString() !== req.user.id) {
                return res.status(400).json({ message: 'Invalid parent folder' });
            }
        }

        const folder = new Folder({
            name,
            description,
            parentFolder: parentFolder === 'root' ? null : parentFolder,
            isPublic,
            pin: !isPublic && pin ? pin : null,
            author: req.user.id
        });

        await folder.save();
        await folder.populate('parentFolder', 'name');

        res.status(201).json(folder);
    } catch (error) {
        console.error('Error in createFolder:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update folder
exports.updateFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Check ownership
        if (folder.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { name, description, parentFolder, isPublic, pin } = req.body;

        // Validate PIN if folder is private
        if (!isPublic && pin) {
            if (!/^\d{4}$/.test(pin)) {
                return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
            }
        }

        // Prevent circular references (folder can't be its own parent)
        if (parentFolder && parentFolder !== 'root') {
            if (parentFolder === folder._id.toString()) {
                return res.status(400).json({ message: 'Folder cannot be its own parent' });
            }

            // Check if new parent is a descendant of this folder
            const isDescendant = await checkIfDescendant(folder._id, parentFolder);
            if (isDescendant) {
                return res.status(400).json({ message: 'Cannot move folder into its own subfolder' });
            }
        }

        folder.name = name || folder.name;
        folder.description = description !== undefined ? description : folder.description;
        folder.parentFolder = parentFolder === 'root' ? null : (parentFolder || folder.parentFolder);
        folder.isPublic = isPublic !== undefined ? isPublic : folder.isPublic;
        folder.pin = !isPublic && pin ? pin : null;

        await folder.save();
        await folder.populate('parentFolder', 'name');

        res.json(folder);
    } catch (error) {
        console.error('Error in updateFolder:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete folder (and optionally move contents)
exports.deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Check ownership
        if (folder.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { moveContentsTo } = req.body; // Optional: 'root' or another folder ID

        // Move templates to new location
        if (moveContentsTo === 'root') {
            await Template.updateMany(
                { folder: folder._id },
                { folder: null }
            );
        } else if (moveContentsTo) {
            await Template.updateMany(
                { folder: folder._id },
                { folder: moveContentsTo }
            );
        } else {
            // Delete all templates in this folder
            await Template.deleteMany({ folder: folder._id });
        }

        // Move subfolders to new location
        if (moveContentsTo === 'root') {
            await Folder.updateMany(
                { parentFolder: folder._id },
                { parentFolder: null }
            );
        } else if (moveContentsTo) {
            await Folder.updateMany(
                { parentFolder: folder._id },
                { parentFolder: moveContentsTo }
            );
        } else {
            // Recursively delete all subfolders
            await deleteSubfoldersRecursively(folder._id);
        }

        await folder.deleteOne();
        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error in deleteFolder:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify PIN for private folder
exports.verifyPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        if (folder.isPublic) {
            return res.json({ valid: true });
        }

        // Owner always has access
        if (folder.author.toString() === req.user.id) {
            return res.json({ valid: true });
        }

        // Check PIN
        if (folder.pin === pin) {
            return res.json({ valid: true });
        }

        res.json({ valid: false });
    } catch (error) {
        console.error('Error in verifyPin:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update folder cover image
exports.updateCoverImage = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        // Check ownership
        if (folder.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get first template in folder and extract its first image
        const firstTemplate = await Template.findOne({ folder: folder._id })
            .sort({ createdAt: 1 });

        if (firstTemplate && firstTemplate.content) {
            // Extract first image from HTML content
            const imgMatch = firstTemplate.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
                folder.coverImage = imgMatch[1];
                await folder.save();
            }
        }

        res.json(folder);
    } catch (error) {
        console.error('Error in updateCoverImage:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to check if a folder is a descendant of another
async function checkIfDescendant(folderId, potentialDescendantId) {
    let current = await Folder.findById(potentialDescendantId);

    while (current && current.parentFolder) {
        if (current.parentFolder.toString() === folderId.toString()) {
            return true;
        }
        current = await Folder.findById(current.parentFolder);
    }

    return false;
}

// Helper function to recursively delete subfolders
async function deleteSubfoldersRecursively(folderId) {
    const subfolders = await Folder.find({ parentFolder: folderId });

    for (const subfolder of subfolders) {
        await deleteSubfoldersRecursively(subfolder._id);
        await Template.deleteMany({ folder: subfolder._id });
        await subfolder.deleteOne();
    }
}
