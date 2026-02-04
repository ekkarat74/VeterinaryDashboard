const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const outbreakController = require('../controllers/outbreakController');

router.get('/', outbreakController.getOutbreaks);
router.post('/', authenticateToken, authorizeRole(['admin', 'superadmin']), outbreakController.createOutbreak);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), outbreakController.updateOutbreak);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'superadmin']), outbreakController.deleteOutbreak);

module.exports = router;