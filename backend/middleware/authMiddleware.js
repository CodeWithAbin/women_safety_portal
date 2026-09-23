const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Middleware to verify JWT authentication token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_389274928374';
    const decoded = jwt.verify(token, jwtSecret);

    // Fetch active user from database to ensure account still exists
    const user = await db.get('SELECT id, name, email, state, district, phone, role FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User account not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

/**
 * Middleware to restrict route strictly to Admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Administrator privileges required.'
    });
  }
  next();
};

/**
 * Middleware to restrict route to standard User (if needed)
 */
const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. User account required.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser
};
