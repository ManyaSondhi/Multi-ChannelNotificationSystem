const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location,
    }));
    logger.error('Validation errors', {
      errors: errorMessages,
      body: req.body,
      url: req.url,
    });
    return res.status(400).json({
      error: 'Validation error',
      message: errorMessages[0]?.message || 'Validation failed',
      details: errorMessages,
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validations = {
  // Auth validations
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    handleValidationErrors,
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors,
  ],

  // Notification validations
  sendNotification: [
    body('userId').optional().isMongoId().withMessage('userId must be valid MongoDB ID'),
    body('userIds').optional().isArray().withMessage('userIds must be an array'),
    body('userIds.*').optional().isMongoId().withMessage('All userIds must be valid MongoDB IDs'),
    body('templateCode').trim().notEmpty(),
    body('data').optional().isObject(),
    body('channelHints').optional().isArray(),
    body('channelHints.*').isIn(['email', 'webpush']),
    body('correlationId').optional().isUUID(),
    body('audience').optional().isIn(['single', 'bulk']),
    body().custom((value) => {
      // Either userId (single) or userIds (bulk) must be provided
      if (!value.userId && !value.userIds) {
        throw new Error('Either userId (single) or userIds (bulk) must be provided');
      }
      if (value.userId && value.userIds) {
        throw new Error('Cannot provide both userId and userIds');
      }
      return true;
    }),
    handleValidationErrors,
  ],

  // Template validations
  createTemplate: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Template name is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Template name must be between 1 and 200 characters'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Template code is required')
      .matches(/^[A-Z0-9_]+$/)
      .withMessage('Template code must contain only uppercase letters, numbers, and underscores')
      .isLength({ min: 1, max: 50 })
      .withMessage('Template code must be between 1 and 50 characters'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    // Channels validation - make it more lenient, allow any structure
    body('channels').optional().custom((value) => {
      if (value !== undefined && typeof value !== 'object') {
        throw new Error('Channels must be an object');
      }
      return true;
    }),
    handleValidationErrors,
  ],
  updateTemplate: [
    body('name').optional().trim().notEmpty(),
    body('code').optional().trim().notEmpty().matches(/^[A-Z0-9_]+$/),
    handleValidationErrors,
  ],

  // Preference validations
  updatePreference: [
    body('channels.email.enabled').optional().isBoolean(),
    body('channels.webpush.enabled').optional().isBoolean(),
    body('quietHours.enabled').optional().isBoolean(),
    body('quietHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('quietHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    handleValidationErrors,
  ],

  // Webhook validations
  twilioWebhook: [
    body('MessageSid').optional().notEmpty(),
    body('MessageStatus').optional().notEmpty(),
    handleValidationErrors,
  ],

  // ID validations
  mongoId: [
    param('id').custom((value) => {
      // Skip validation for "new" and "undefined" - these are handled by the route
      if (value === 'new' || value === 'undefined') {
        return true;
      }
      // Use express-validator's isMongoId for actual validation
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid MongoDB ObjectId format');
      }
      return true;
    }),
    handleValidationErrors,
  ],
  userId: [
    param('userId').isMongoId(),
    handleValidationErrors,
  ],
  correlationId: [
    param('correlationId').isUUID(),
    handleValidationErrors,
  ],
};

module.exports = {
  validations,
  handleValidationErrors,
};

