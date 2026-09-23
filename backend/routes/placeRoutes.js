const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 4. Browse accepted hazardous places filtered by State & District (Authenticated)
router.get('/', authenticateToken, placeController.getPlaces);

// 5. Submit a place report for review with photo upload (Authenticated)
router.post('/report', authenticateToken, upload.single('photo'), placeController.reportPlace);

module.exports = router;
