const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Enforce authentication & admin privileges for all /api/admin routes
router.use(authenticateToken, requireAdmin);

// 8. View user reports (supports optional ?status=pending)
router.get('/reports', adminController.getReports);

// 9. Accept or reject user report
router.patch('/reports/:id/status', adminController.updateReportStatus);

// 10. View all hazardous places (with State & District filter)
router.get('/places', adminController.getPlaces);

// 11. Directly create an accepted hazardous place
router.post('/places', upload.single('photo'), adminController.createPlace);

// 12. Update hazardous place
router.put('/places/:id', upload.single('photo'), adminController.updatePlace);

// 13. Delete hazardous place
router.delete('/places/:id', adminController.deletePlace);

// 14. View registered users (with State & District filter)
router.get('/users', adminController.getUsers);

// 15. Update user profile
router.put('/users/:id', adminController.updateUser);

// 16. Delete user account (Admin account protected, places preserved with submitted_by = NULL)
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
