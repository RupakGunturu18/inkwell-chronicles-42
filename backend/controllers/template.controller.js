const Template = require('../models/template.model');

// Get all public templates
exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ isPublic: true })
            .populate('author', 'name username profileImage')
            .sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        console.error('Error in getAllTemplates:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's templates
exports.getMyTemplates = async (req, res) => {
    try {
        const templates = await Template.find({ author: req.user.id })
            .sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        console.error('Error in getMyTemplates:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single template
exports.getTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id)
            .populate('author', 'name username profileImage');

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Check if user has access (public or owner)
        if (!template.isPublic && template.author._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error in getTemplate:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create template
exports.createTemplate = async (req, res) => {
    try {
        const { name, description, category, content, isPublic, folder } = req.body;

        const template = new Template({
            name,
            description,
            category,
            content,
            isPublic,
            folder: folder || null,
            author: req.user.id
        });

        await template.save();
        await template.populate('author', 'name username profileImage');

        res.status(201).json(template);
    } catch (error) {
        console.error('Error in createTemplate:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update template
exports.updateTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Check ownership
        if (template.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { name, description, category, content, isPublic, folder } = req.body;

        template.name = name || template.name;
        template.description = description || template.description;
        template.category = category || template.category;
        template.content = content || template.content;
        template.isPublic = isPublic !== undefined ? isPublic : template.isPublic;
        template.folder = folder !== undefined ? folder : template.folder;

        await template.save();
        await template.populate('author', 'name username profileImage');

        res.json(template);
    } catch (error) {
        console.error('Error in updateTemplate:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Check ownership
        if (template.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await template.deleteOne();
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error in deleteTemplate:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
