const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 1. User registration (Public)
router.post('/register', authController.register);

// 2. Unified login for User & Admin (Public)
router.post('/login', authController.login);

// 3. Current session hydration & verification (Authenticated)
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
