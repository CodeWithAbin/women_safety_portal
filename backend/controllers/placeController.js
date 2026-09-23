const db = require('../config/db');
const { isValidRating, validateRequiredFields } = require('../utils/validation');

/**
 * Browse accepted hazardous places
 * GET /api/places?state=...&district=...
 */
const getPlaces = async (req, res) => {
  try {
    const { state, district } = req.query;

    let query = "SELECT id, name, address, state, district, photo, rating, description, status, created_at FROM places WHERE status = 'accepted'";
    const params = [];

    if (state && district) {
      query += " AND LOWER(state) = LOWER(?) AND LOWER(district) = LOWER(?)";
      params.push(state.trim(), district.trim());
    } else if (state) {
      query += " AND LOWER(state) = LOWER(?)";
      params.push(state.trim());
    }

    query += " ORDER BY created_at DESC";

    const places = await db.all(query, params);

    return res.status(200).json({
      success: true,
      count: places.length,
      data: places
    });
  } catch (error) {
    console.error('GetPlaces error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching hazardous places.'
    });
  }
};

/**
 * Report an unsafe/hazardous place
 * POST /api/places/report
 */
const reportPlace = async (req, res) => {
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
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        name.trim(),
        address.trim(),
        state.trim(),
        district.trim(),
        photoUrl,
        parseInt(rating, 10),
        description.trim(),
        req.user.id
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Hazardous place reported successfully. It is pending admin review.',
      data: {
        id: result.lastInsertRowid,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('ReportPlace error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting report.'
    });
  }
};

module.exports = {
  getPlaces,
  reportPlace
};
