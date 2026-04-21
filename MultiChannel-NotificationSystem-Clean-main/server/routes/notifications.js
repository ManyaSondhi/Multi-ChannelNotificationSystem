const express = require('express');
const NotificationService = require('../services/NotificationService');
const DeliveryLog = require('../models/DeliveryLog');
const { validations } = require('../middleware/validation');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { userRateLimiter, channelRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * Send notification (unified endpoint)
 */
router.post(
  '/send',
  authenticate,
  channelRateLimiter,
  validations.sendNotification,
  async (req, res, next) => {
    try {
      const { userId, userIds, templateCode, data, channelHints, correlationId, maxRetries, audience } = req.body;

      const result = await NotificationService.sendNotification({
        userId,
        userIds,
        templateCode,
        data,
        channelHints,
        correlationId,
        maxRetries,
        audience: audience || (userIds ? 'bulk' : 'single'),
      });

      // Handle bulk notification response
      if (result.audience === 'bulk') {
        return res.status(201).json({
          correlationId: result.correlationId,
          audience: 'bulk',
          totalUsers: result.totalUsers,
          successful: result.results.filter((r) => r.success).length,
          failed: result.results.filter((r) => !r.success).length,
          results: result.results,
        });
      }

      // Single notification response
      res.status(201).json({
        correlationId: result.correlationId,
        status: result.status,
        notification: await NotificationService.getByCorrelationId(result.correlationId),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Send test notification (admin only)
 */
router.post(
  '/test',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { userId, templateCode, data, channelHints } = req.body;

      // Use current user if no userId provided
      const targetUserId = userId || req.user._id;

      const result = await NotificationService.sendNotification({
        userId: targetUserId,
        templateCode,
        data,
        channelHints,
        maxRetries: 1, // Lower retries for test
      });

      res.status(201).json({
        correlationId: result.correlationId,
        status: result.status,
        message: 'Test notification sent successfully',
        notification: await NotificationService.getByCorrelationId(result.correlationId),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get notification by correlation ID
 */
router.get(
  '/:correlationId',
  authenticate,
  validations.correlationId,
  async (req, res, next) => {
    try {
      const { correlationId } = req.params;
      const notification = await NotificationService.getByCorrelationId(correlationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Check authorization (user can only see their own, admin can see all)
      if (req.user.role !== 'admin' && notification.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get delivery logs
      const logs = await DeliveryLog.find({ correlationId })
        .sort({ createdAt: -1 });

      res.json({
        notification,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * List notifications with filters
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filters = {
      ...req.query,
    };

    // Non-admin users can only see their own notifications
    if (req.user.role !== 'admin') {
      filters.userId = req.user._id;
    }

    const result = await NotificationService.list(filters);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Retry failed delivery (admin only)
 */
router.post(
  '/:id/retry/:channel',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id, channel } = req.params;
      const notification = await NotificationService.retryDelivery(id, channel);

      res.json({ notification });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get delivery statistics
 */
router.get('/stats/delivery', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { channel, startDate, endDate, templateCode } = req.query;
    const query = {};

    if (channel) query.channel = channel;
    if (templateCode) query.correlationId = { $regex: templateCode };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await DeliveryLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgLatency: { $avg: '$latency' },
        },
      },
    ]);

    // Get channel breakdown
    const channelStats = await DeliveryLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: { channel: '$channel', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await DeliveryLog.countDocuments(query);

    res.json({
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgLatency: stat.avgLatency,
        };
        return acc;
      }, {}),
      byChannel: channelStats.reduce((acc, stat) => {
        if (!acc[stat._id.channel]) {
          acc[stat._id.channel] = {};
        }
        acc[stat._id.channel][stat._id.status] = stat.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
