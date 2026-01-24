const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folder.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Folder CRUD
router.get('/', folderController.getAllFolders);
router.get('/parent/:parentId', folderController.getFoldersByParent);
router.get('/:id', folderController.getFolder);
router.post('/', folderController.createFolder);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

// PIN verification
router.post('/:id/verify-pin', folderController.verifyPin);

// Cover image update
router.put('/:id/cover-image', folderController.updateCoverImage);

module.exports = router;
