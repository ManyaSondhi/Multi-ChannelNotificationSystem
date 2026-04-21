const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const DeliveryLog = require('../models/DeliveryLog');
const TemplateService = require('./TemplateService');
const PreferenceService = require('./PreferenceService');
const User = require('../models/User');
const { createAdapters } = require('../adapters');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.adapters = createAdapters(process.env);
  }

  async sendNotification({
    userId,
    userIds,
    templateCode,
    data = {},
    channelHints = [],
    correlationId = null,
    maxRetries = 3,
    audience = 'single',
  }) {
    try {
      const template = await TemplateService.getByCode(templateCode);
      if (!template) throw new Error(`Template not found: ${templateCode}`);

      // Handle bulk notifications
      if (audience === 'bulk' && userIds && Array.isArray(userIds)) {
        return await this.sendBulkNotifications({
          userIds,
          template,
          data,
          channelHints,
          correlationId,
          maxRetries,
        });
      }

      if (!userId) throw new Error('userId is required for single notifications');

      const preference = await PreferenceService.getByUserId(userId);

      // Get channels enabled for user + template
      const userEnabledChannels = await PreferenceService.getEnabledChannels(
        userId,
        channelHints
      );

      const enabledChannels = userEnabledChannels.filter((channel) => {
        const channelConfig = template.channels[channel];
        return channelConfig && channelConfig.enabled === true;
      });

      // Filter out channels that don't have required contact information
      const channelsWithContactInfo = enabledChannels.filter((channel) => {
        if (channel === 'email') {
          return preference.channels.email?.address && preference.channels.email.address.trim() !== '';
        } else if (channel === 'webpush') {
          return preference.channels.webpush?.subscriptions && preference.channels.webpush.subscriptions.length > 0;
        }
        return true;
      });

      console.log("Enabled channels for user:", enabledChannels);
      console.log("Channels with contact info:", channelsWithContactInfo);

      if (channelsWithContactInfo.length === 0) {
        throw new Error('No channels have valid contact information. Please update your preferences.');
      }

      if (enabledChannels.length === 0) {
        throw new Error('No enabled channels found for this user/template');
      }

      let notification;
      if (correlationId) {
        notification = await Notification.findOne({ correlationId, userId });
      }

      if (!notification) {
        notification = new Notification({
          correlationId: correlationId || uuidv4(),
          templateId: template._id,
          templateCode: template.code,
          userId,
          data,
          channelHints: enabledChannels,
          maxRetries,
          audience: 'single',
          status: 'pending',
        });

        notification.deliveries = channelsWithContactInfo.map((ch) => ({
          channel: ch,
          status: 'pending',
        }));

        await notification.save();
      } else {
        notification.data = { ...notification.data, ...data };
        notification.status = 'processing';
        await notification.save();
      }

      await this.processDeliveries(notification, template, preference, channelsWithContactInfo);
      await this.updateNotificationStatus(notification._id);

      return await Notification.findById(notification._id);
    } catch (error) {
      logger.error(`Error sending notification: ${error.message}`, error);
      throw error;
    }
  }

  async sendBulkNotifications({ userIds, template, data = {}, channelHints = [], correlationId = null, maxRetries = 3 }) {
    const baseCorrelationId = correlationId || uuidv4();
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (userId, index) => {
        try {
          const userCorrelationId = `${baseCorrelationId}-${i + index}`;
          const result = await this.sendNotification({
            userId,
            templateCode: template.code,
            data,
            channelHints,
            correlationId: userCorrelationId,
            maxRetries,
            audience: 'single',
          });
          return { userId, success: true, notification: result };
        } catch (error) {
          logger.error(`Error sending bulk notification to ${userId}: ${error.message}`);
          return { userId, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map((r) => (r.status === 'fulfilled' ? r.value : r.reason)));
    }

    const bulkNotification = new Notification({
      correlationId: baseCorrelationId,
      templateId: template._id,
      templateCode: template.code,
      userId: userIds[0],
      data,
      channelHints,
      maxRetries,
      audience: 'bulk',
      status: 'processing',
      metadata: {
        totalUsers: userIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });

    await bulkNotification.save();

    return {
      correlationId: baseCorrelationId,
      audience: 'bulk',
      totalUsers: userIds.length,
      results,
      notification: bulkNotification,
    };
  }

  async processDeliveries(notification, template, preference, channels) {
    const deliveryPromises = channels.map((channel) =>
      this.sendViaChannel(notification, template, preference, channel)
    );
    await Promise.allSettled(deliveryPromises);
  }

  async sendViaChannel(notification, template, preference, channel) {
    const delivery = notification.deliveries.find((d) => d.channel === channel);
    if (!delivery) return;

    try {
      // Fetch user information to enrich template data
      const user = await User.findById(notification.userId).select('name email phone');
      
      // Enrich notification data with user information
      // This allows templates to use {{user.name}}, {{user.email}}, etc.
      // Merge user data: notification.data.user (if exists) takes precedence, but fall back to actual user record
      const userData = {
        name: (notification.data?.user?.name) || user?.name || '',
        email: (notification.data?.user?.email) || user?.email || '',
        phone: (notification.data?.user?.phone) || user?.phone || '',
        // Allow additional user properties from notification.data.user
        ...(notification.data?.user || {}),
      };
      
      // Separate user data from other data
      // If notification.data has a 'data' property, use it; otherwise, use all properties except 'user'
      const customData = notification.data?.data || (() => {
        const { user: _, data: __, ...rest } = notification.data || {};
        return rest;
      })();
      
      const enrichedData = {
        // Add user object for nested access ({{user.name}})
        user: userData,
        // Add data object for nested access ({{data.discount}}, {{data.couponCode}}, etc.)
        data: customData,
        // Also support flat structure for backward compatibility ({{name}}, {{email}}, {{discount}})
        // Use data from notification.data if provided, otherwise fall back to user data
        name: notification.data?.name || userData.name || '',
        email: notification.data?.email || userData.email || '',
        phone: notification.data?.phone || userData.phone || '',
        // Spread custom data at root level for flat access
        ...customData,
      };
      
      // Log enriched data for debugging
      console.log(`[Template Rendering] Channel: ${channel}, Template: ${template.code}`);
      console.log(`[Template Rendering] User data:`, JSON.stringify(enrichedData.user, null, 2));
      console.log(`[Template Rendering] Data object:`, JSON.stringify(enrichedData.data, null, 2));
      console.log(`[Template Rendering] All data keys:`, Object.keys(enrichedData));
      console.log(`[Template Rendering] Full enriched data:`, JSON.stringify(enrichedData, null, 2));
      logger.debug(`Template rendering for channel ${channel}:`, {
        templateCode: template.code,
        channel,
        enrichedDataKeys: Object.keys(enrichedData),
        userData: enrichedData.user,
        customData: enrichedData.data,
      });
      
      const rendered = TemplateService.renderTemplate(
        template,
        channel,
        enrichedData,
        preference.language
      );

      if (!rendered) throw new Error(`Template not configured for channel: ${channel}`);

      const payload = this.preparePayload(channel, rendered, preference, notification.userId);
      const adapter = this.adapters[channel];
      if (!adapter) throw new Error(`Adapter not found for ${channel}`);

      const start = Date.now();
      const result = await adapter.send(payload, {
        correlationId: notification.correlationId,
        notificationId: notification._id,
        userId: notification.userId,
      });
      const latency = Date.now() - start;

      delivery.status = result.success ? 'sent' : 'failed';
      delivery.externalId = result.externalId;
      delivery.attempts += 1;
      delivery.lastAttemptAt = new Date();
      delivery.error = result.success ? null : result.error;
      delivery.metadata = result.metadata || {};

      await DeliveryLog.create({
        notificationId: notification._id,
        correlationId: notification.correlationId,
        userId: notification.userId,
        channel,
        status: result.success ? 'sent' : 'failed',
        externalId: result.externalId,
        provider: channel === 'email' ? 'nodemailer' : 'web-push',
        attempts: delivery.attempts,
        error: result.error,
        metadata: result.metadata,
        latency,
      });

      await notification.save();
    } catch (error) {
      logger.error(`Error sending via ${channel}: ${error.message}`, error);
      delivery.status = 'failed';
      delivery.attempts += 1;
      delivery.lastAttemptAt = new Date();
      delivery.error = error.message;
      await DeliveryLog.create({
        notificationId: notification._id,
        correlationId: notification.correlationId,
        userId: notification.userId,
        channel,
        status: 'failed',
        attempts: delivery.attempts,
        error: error.message,
        metadata: { stack: error.stack },
      });
      await notification.save();
    }
  }

  preparePayload(channel, rendered, preference) {
    const payload = {};

    if (channel === 'email') {
      if (!preference.channels.email?.address) {
        throw new Error('Email address is required but not set in user preferences');
      }
      payload.to = preference.channels.email.address;
      payload.subject = rendered.subject;
      payload.html = rendered.html;
      payload.text = rendered.text;
    } else if (channel === 'webpush') {
      const subs = preference.channels.webpush?.subscriptions;
      if (!subs || subs.length === 0) {
        throw new Error('Web push subscription is required but not set in user preferences');
      }
      payload.subscription = subs[0];
      payload.title = rendered.title;
      payload.body = rendered.body;
      payload.icon = rendered.icon;
      payload.badge = rendered.badge;
      payload.data = rendered.data;
      payload.actions = rendered.actions;
    }

    return payload;
  }

  async updateNotificationStatus(notificationId) {
    const n = await Notification.findById(notificationId);
    if (!n) return;

    const sent = n.deliveries.filter((d) => d.status === 'sent').length;
    const failed = n.deliveries.filter((d) => d.status === 'failed').length;
    const total = n.deliveries.length;

    if (sent === total) n.status = 'sent';
    else if (failed === total) n.status = 'failed';
    else if (sent > 0) n.status = 'partial';
    else n.status = 'processing';

    n.completedAt = new Date();
    await n.save();
  }

  async retryDelivery(notificationId, channel, maxRetries = 3) {
    const n = await Notification.findById(notificationId);
    if (!n) throw new Error('Notification not found');
    const d = n.deliveries.find((x) => x.channel === channel);
    if (!d) throw new Error(`Delivery not found for ${channel}`);
    if (d.attempts >= maxRetries) throw new Error('Max retries exceeded');

    const template = await TemplateService.getById(n.templateId);
    const pref = await PreferenceService.getByUserId(n.userId);
    const delay = Math.pow(2, d.attempts) * 1000;
    await new Promise((r) => setTimeout(r, delay));
    await this.sendViaChannel(n, template, pref, channel);
    await this.updateNotificationStatus(notificationId);
    return n;
  }

  async getByCorrelationId(correlationId) {
    return await Notification.findOne({ correlationId })
      .populate('templateId')
      .populate('userId', 'name email');
  }

  async list(filters = {}) {
    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.templateCode) query.templateCode = filters.templateCode;
    if (filters.channel) query['deliveries.channel'] = filters.channel;

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('templateId', 'name code')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new NotificationService();
