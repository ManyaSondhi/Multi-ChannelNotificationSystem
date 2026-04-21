const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validations } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * Register new user
 */
router.post('/register', validations.register, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await User.create({ email, password, name });

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Login user
 */
router.post('/login', validations.login, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Normalize email (express-validator should have done this, but ensure it's lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`, error);
    next(error);
  }
});

/**
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      phone: req.user.phone,
    },
  });
});

module.exports = router;






