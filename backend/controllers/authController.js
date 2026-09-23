const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { isValidEmail, validateRequiredFields } = require('../utils/validation');

/**
 * Register a new user account
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, state, district, phone } = req.body;

    // Validate required fields
    const missingFields = validateRequiredFields(req.body, ['name', 'email', 'password', 'state', 'district']);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Validate password length
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user strictly with role = 'user'
    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, state, district, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        state.trim(),
        district.trim(),
        phone ? phone.trim() : null
      ]
    );

    const userId = result.lastInsertRowid;

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_389274928374';
    const token = jwt.sign(
      { id: userId, email: normalizedEmail, role: 'user' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        state: state.trim(),
        district: district.trim(),
        phone: phone ? phone.trim() : null,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
};

/**
 * Unified login endpoint for both User and Admin
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const missingFields = validateRequiredFields(req.body, ['email', 'password']);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user by email
    const user = await db.get(
      `SELECT id, name, email, password_hash, state, district, phone, role 
       FROM users 
       WHERE email = ?`,
      [normalizedEmail]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_389274928374';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Verify and restore active user session
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
