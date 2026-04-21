const RateLimit = require('../models/RateLimit');
const logger = require('../utils/logger');

/**
 * Rate limiting based on MongoDB
 * Tracks requests per user and per user:channel combination
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    type = 'user', // 'user' or 'user_channel'
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Skip if no user (for public endpoints)
      if (!req.user && type === 'user') {
        return next();
      }

      const now = Date.now();
      const windowStart = new Date(now - windowMs);
      const windowEnd = new Date(now + windowMs);

      // Build identifier
      let identifier;
      if (type === 'user') {
        identifier = req.user?.id || req.ip;
      } else if (type === 'user_channel') {
        const channel = req.body.channelHints?.[0] || 'default';
        identifier = `${req.user?.id || req.ip}:${channel}`;
      }

      // Find or create rate limit record
      let rateLimit = await RateLimit.findOne({
        identifier,
        type,
        windowEnd: { $gt: new Date() },
      });

      if (!rateLimit) {
        // Create new window
        rateLimit = new RateLimit({
          identifier,
          type,
          count: 0,
          windowStart,
          windowEnd,
        });
      }

      // Check if limit exceeded
      if (rateLimit.count >= max) {
        const retryAfter = Math.ceil((rateLimit.windowEnd - now) / 1000);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter,
          limit: max,
          window: windowMs,
        });
      }

      // Increment counter (will be saved after request)
      rateLimit.count += 1;
      await rateLimit.save();

      // Attach rate limit info to response
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateLimit.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.windowEnd.getTime() / 1000));

      next();
    } catch (error) {
      logger.error(`Rate limiter error: ${error.message}`);
      // On error, allow request (fail open)
      next();
    }
  };
};

/**
 * Per-user rate limiter
 */
const userRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  type: 'user',
});

/**
 * Per-channel rate limiter (stricter)
 */
const channelRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Lower limit per channel
  type: 'user_channel',
});

module.exports = {
  createRateLimiter,
  userRateLimiter,
  channelRateLimiter,
};







