const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 6. View notifications for the authenticated user
router.get('/', authenticateToken, notificationController.getNotifications);

// 7. Mark a specific user notification as read
router.patch('/:id/read', authenticateToken, notificationController.markAsRead);

module.exports = router;
