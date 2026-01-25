const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const auth = require('../middleware/auth');

// Public routes
router.get('/', templateController.getAllTemplates);

// Protected routes
router.get('/my-templates', auth, templateController.getMyTemplates);
router.get('/:id', auth, templateController.getTemplate);
router.post('/', auth, templateController.createTemplate);
router.put('/:id', auth, templateController.updateTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);

module.exports = router;
