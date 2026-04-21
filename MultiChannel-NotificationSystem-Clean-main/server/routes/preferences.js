const express = require('express');
const PreferenceService = require('../services/PreferenceService');
const { validations } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * Get VAPID public key for webpush subscription (must be before /:userId route)
 */
router.get('/webpush/vapid-key', authenticate, async (req, res, next) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: 'VAPID public key not configured' });
    }
    res.json({ publicKey });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user preferences
 */
router.get(
  '/:userId',
  authenticate,
  validations.userId,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Users can only access their own preferences (unless admin)
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const preference = await PreferenceService.getByUserId(userId);
      res.json({ preference });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update user preferences
 */
router.put(
  '/:userId',
  authenticate,
  validations.userId,
  validations.updatePreference,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Users can only update their own preferences (unless admin)
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const preference = await PreferenceService.update(userId, req.body);
      res.json({ preference });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Add web push subscription
 */
router.post(
  '/:userId/webpush',
  authenticate,
  validations.userId,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      // Users can only manage their own subscriptions (unless admin)
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const preference = await PreferenceService.addWebPushSubscription(userId, subscription);
      res.json({ preference });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Remove web push subscription
 */
router.delete(
  '/:userId/webpush/:endpoint',
  authenticate,
  validations.userId,
  async (req, res, next) => {
    try {
      const { userId, endpoint } = req.params;

      // Users can only manage their own subscriptions (unless admin)
      if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const preference = await PreferenceService.removeWebPushSubscription(userId, endpoint);
      res.json({ preference });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;







