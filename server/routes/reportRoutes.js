const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.get('/', reportController.getReports); // Public or Auth? Original was Public
router.post('/', authenticateToken, authorizeRole(['admin', 'superadmin']), reportController.createReport);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), reportController.updateReport);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), reportController.deleteReport);
router.delete('/', authenticateToken, authorizeRole(['superadmin']), reportController.clearAllReports);

module.exports = router;