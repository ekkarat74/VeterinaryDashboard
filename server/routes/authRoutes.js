const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// Auth
router.post('/login', authController.login);
router.post('/change-password', authenticateToken, authController.changePassword);

// User Management (Superadmin)
router.get('/users', authenticateToken, authorizeRole(['superadmin']), authController.getUsers);
router.post('/users', authenticateToken, authorizeRole(['superadmin']), authController.createUser);
router.put('/users/:id', authenticateToken, authorizeRole(['superadmin']), authController.updateUser);
router.put('/users/:id/reset-password', authenticateToken, authorizeRole(['superadmin']), authController.resetUserPassword);
router.delete('/users/:id', authenticateToken, authorizeRole(['superadmin']), authController.deleteUser);

module.exports = router;