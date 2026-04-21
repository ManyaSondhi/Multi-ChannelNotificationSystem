const webpush = require('web-push');
const BaseAdapter = require('./BaseAdapter');

class WebPushAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.initialize();
  }

  initialize() {
    try {
      if (this.config.publicKey && this.config.privateKey) {
        webpush.setVapidDetails(
          this.config.subject,
          this.config.publicKey,
          this.config.privateKey
        );
      }
    } catch (error) {
      console.error('WebPush adapter initialization error:', error);
    }
  }

  validate(payload) {
    const errors = [];
    if (!payload.subscription) errors.push('Push subscription is required');
    if (!payload.subscription?.endpoint) {
      errors.push('Subscription endpoint is required');
    }
    if (!payload.subscription?.keys) {
      errors.push('Subscription keys are required');
    }
    if (!payload.title && !payload.body) {
      errors.push('Push notification title or body is required');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(payload, options = {}) {
    const validation = this.validate(payload);
    if (!validation.valid) {
      throw new Error(`WebPush validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image,
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        tag: payload.tag,
        renotify: payload.renotify || false,
        timestamp: Date.now(),
      });

      const result = await webpush.sendNotification(
        payload.subscription,
        pushPayload,
        {
          TTL: payload.ttl || 24 * 60 * 60, // 24 hours default
          urgency: payload.urgency || 'normal',
        }
      );

      return {
        success: true,
        externalId: `${payload.subscription.endpoint}-${Date.now()}`,
        metadata: {
          statusCode: result.statusCode,
          body: result.body,
        },
      };
    } catch (error) {
      // Handle specific webpush errors
      let status = 'failed';
      if (error.statusCode === 410) {
        status = 'expired'; // Subscription expired
      } else if (error.statusCode === 404 || error.statusCode === 413) {
        status = 'invalid'; // Invalid subscription
      }

      return {
        success: false,
        externalId: null,
        error: error.message,
        errorCode: error.statusCode?.toString(),
        status,
        metadata: {
          statusCode: error.statusCode,
          endpoint: error.endpoint,
        },
      };
    }
  }

  async sendBatch(subscriptions, payload, options = {}) {
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.send({ ...payload, subscription: sub }, options))
    );

    return results.map((result, index) => ({
      subscription: subscriptions[index],
      result: result.status === 'fulfilled' ? result.value : {
        success: false,
        error: result.reason?.message || 'Unknown error',
      },
    }));
  }

  async test() {
    return !!(this.config.publicKey && this.config.privateKey);
  }
}

module.exports = WebPushAdapter;







