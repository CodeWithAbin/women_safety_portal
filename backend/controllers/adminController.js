const db = require('../config/db');
const { isValidEmail, isValidRating, isValidStatus, validateRequiredFields } = require('../utils/validation');

/**
 * Admin: Get submitted reports (supports ?status=pending or any status)
 * GET /api/admin/reports
 */
const getReports = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        p.id, p.name, p.address, p.state, p.district, p.photo, p.rating, p.description, 
        p.status, p.submitted_by, p.created_at, p.updated_at,
        u.name AS reporter_name, u.email AS reporter_email, u.phone AS reporter_phone
      FROM places p
      LEFT JOIN users u ON p.submitted_by = u.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE p.status = ?`;
      params.push(status.trim().toLowerCase());
    }

    query += ` ORDER BY p.created_at DESC`;

    const reports = await db.all(query, params);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Admin getReports error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching reports.'
    });
  }
};

/**
 * Admin: Accept or reject user report and notify reporting user
 * PATCH /api/admin/reports/:id/status
 */
const updateReportStatus = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID.'
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'accepted' or 'rejected'."
      });
    }

    const normalizedStatus = status.trim().toLowerCase();

    // Check if place/report exists
    const place = await db.get('SELECT * FROM places WHERE id = ?', [reportId]);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Reported place not found.'
      });
    }

    // Update place status in a transaction
    await db.transaction(async (tx) => {
      // 1. Update place status
      await tx.execute({
        sql: `UPDATE places 
              SET status = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?`,
        args: [normalizedStatus, reportId]
      });

      // 2. If submitted by a user, dispatch notification
      if (place.submitted_by) {
        let title, message, type;
        if (normalizedStatus === 'accepted') {
          title = 'Report Accepted';
          message = `Your report for "${place.name}" has been verified and published as an accepted hazardous place.`;
          type = 'report_accepted';
        } else {
          title = 'Report Rejected';
          message = `Your report for "${place.name}" has been reviewed and was not accepted by the administrator.`;
          type = 'report_rejected';
        }

        await tx.execute({
          sql: `INSERT INTO notifications (user_id, place_id, title, message, type, is_read)
                VALUES (?, ?, ?, ?, ?, 0)`,
          args: [place.submitted_by, place.id, title, message, type]
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: `Report status successfully updated to '${normalizedStatus}'.`
    });
  } catch (error) {
    console.error('Admin updateReportStatus error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating report status.'
    });
  }
};

/**
 * Admin: View all hazardous places (with State/District filter)
 * GET /api/admin/places
 */
const getPlaces = async (req, res) => {
  try {
    const { state, district } = req.query;

    let query = `
      SELECT 
        p.id, p.name, p.address, p.state, p.district, p.photo, p.rating, p.description, 
        p.status, p.submitted_by, p.created_at, p.updated_at,
        u.name AS reporter_name, u.email AS reporter_email
      FROM places p
      LEFT JOIN users u ON p.submitted_by = u.id
      WHERE p.status = 'accepted'
    `;
    const params = [];

    if (state && district) {
      query += ` AND LOWER(p.state) = LOWER(?) AND LOWER(p.district) = LOWER(?)`;
      params.push(state.trim(), district.trim());
    } else if (state) {
      query += ` AND LOWER(p.state) = LOWER(?)`;
      params.push(state.trim());
    }

    query += ` ORDER BY p.created_at DESC`;

    const places = await db.all(query, params);

    return res.status(200).json({
      success: true,
      count: places.length,
      data: places
    });
  } catch (error) {
    console.error('Admin getPlaces error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching places.'
    });
  }
};

/**
 * Admin: Directly create an accepted hazardous place
 * POST /api/admin/places
 */
const createPlace = async (req, res) => {
  try {
    const { name, address, state, district, rating, description } = req.body;

    const missingFields = validateRequiredFields(req.body, ['name', 'address', 'state', 'district', 'rating', 'description']);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'A photo of the hazardous place is required.'
      });
    }

    if (!isValidRating(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const result = await db.run(
      `INSERT INTO places (name, address, state, district, photo, rating, description, status, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'accepted', NULL)`,
      [
        name.trim(),
        address.trim(),
        state.trim(),
        district.trim(),
        photoUrl,
        parseInt(rating, 10),
        description.trim()
      ]
    );

    const newPlace = await db.get('SELECT * FROM places WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      success: true,
      message: 'Hazardous place created and published successfully.',
      data: newPlace
    });
  } catch (error) {
    console.error('Admin createPlace error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating place.'
    });
  }
};

/**
 * Admin: Update hazardous place
 * PUT /api/admin/places/:id
 */
const updatePlace = async (req, res) => {
  try {
    const placeId = parseInt(req.params.id, 10);
    const { name, address, state, district, rating, description } = req.body;

    if (isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid place ID.'
      });
    }

    const existingPlace = await db.get('SELECT * FROM places WHERE id = ?', [placeId]);
    if (!existingPlace) {
      return res.status(404).json({
        success: false,
        message: 'Place not found.'
      });
    }

    const missingFields = validateRequiredFields(req.body, ['name', 'address', 'state', 'district', 'rating', 'description']);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (!isValidRating(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : existingPlace.photo;

    await db.run(
      `UPDATE places 
       SET name = ?, address = ?, state = ?, district = ?, photo = ?, rating = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name.trim(),
        address.trim(),
        state.trim(),
        district.trim(),
        photoUrl,
        parseInt(rating, 10),
        description.trim(),
        placeId
      ]
    );

    const updatedPlace = await db.get('SELECT * FROM places WHERE id = ?', [placeId]);

    return res.status(200).json({
      success: true,
      message: 'Hazardous place updated successfully.',
      data: updatedPlace
    });
  } catch (error) {
    console.error('Admin updatePlace error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating place.'
    });
  }
};

/**
 * Admin: Delete hazardous place
 * DELETE /api/admin/places/:id
 */
const deletePlace = async (req, res) => {
  try {
    const placeId = parseInt(req.params.id, 10);

    if (isNaN(placeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid place ID.'
      });
    }

    const place = await db.get('SELECT id FROM places WHERE id = ?', [placeId]);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found.'
      });
    }

    await db.run('DELETE FROM places WHERE id = ?', [placeId]);

    return res.status(200).json({
      success: true,
      message: 'Hazardous place deleted successfully.'
    });
  } catch (error) {
    console.error('Admin deletePlace error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting place.'
    });
  }
};

/**
 * Admin: View registered users (with State/District filter, no passwords)
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { state, district } = req.query;

    let query = `
      SELECT id, name, email, state, district, phone, role, created_at, updated_at
      FROM users
    `;
    const params = [];

    if (state && district) {
      query += ` WHERE LOWER(state) = LOWER(?) AND LOWER(district) = LOWER(?)`;
      params.push(state.trim(), district.trim());
    } else if (state) {
      query += ` WHERE LOWER(state) = LOWER(?)`;
      params.push(state.trim());
    }

    query += ` ORDER BY created_at DESC`;

    const users = await db.all(query, params);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Admin getUsers error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users.'
    });
  }
};

/**
 * Admin: Update user profile
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { name, email, state, district, phone } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const missingFields = validateRequiredFields(req.body, ['name', 'email', 'state', 'district']);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is used by another user
    const duplicateUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [normalizedEmail, userId]);
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    await db.run(
      `UPDATE users 
       SET name = ?, email = ?, state = ?, district = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name.trim(),
        normalizedEmail,
        state.trim(),
        district.trim(),
        phone ? phone.trim() : null,
        userId
      ]
    );

    const updatedUser = await db.get(
      `SELECT id, name, email, state, district, phone, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser
    });
  } catch (error) {
    console.error('Admin updateUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating user.'
    });
  }
};

/**
 * Admin: Delete user (cascades notifications, sets submitted_by = NULL on places, protects Admin account)
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // STRICT CHECK: The single Admin account cannot be deleted
    const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : null;
    if (user.role === 'admin' || (adminEmail && user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. The administrator account cannot be deleted.'
      });
    }

    // Perform safe deletion in transaction
    await db.transaction(async (tx) => {
      // 1. Nullify submitted_by on places to preserve historical hazardous places
      await tx.execute({
        sql: 'UPDATE places SET submitted_by = NULL WHERE submitted_by = ?',
        args: [userId]
      });

      // 2. Delete user's notifications
      await tx.execute({
        sql: 'DELETE FROM notifications WHERE user_id = ?',
        args: [userId]
      });

      // 3. Delete user account
      await tx.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [userId]
      });
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully. Historical submitted places preserved.'
    });
  } catch (error) {
    console.error('Admin deleteUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user.'
    });
  }
};

module.exports = {
  getReports,
  updateReportStatus,
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  getUsers,
  updateUser,
  deleteUser
};
