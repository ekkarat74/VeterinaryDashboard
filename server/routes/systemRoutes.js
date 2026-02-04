const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const systemController = require('../controllers/systemController');

router.get('/logs', authenticateToken, authorizeRole(['superadmin']), systemController.getLogs);
router.get('/backup', authenticateToken, authorizeRole(['admin', 'superadmin']), systemController.getBackup);
router.post('/restore', authenticateToken, authorizeRole(['superadmin']), systemController.restoreSystem);

module.exports = router;