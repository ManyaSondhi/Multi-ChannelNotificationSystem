const Preference = require('../models/Preference');
const User = require('../models/User');

class PreferenceService {
  /**
   * Get user preferences
   */
  async getByUserId(userId) {
    let preference = await Preference.findOne({ userId });
    
    if (!preference) {
      // Create default preferences
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      preference = await this.createDefault(userId, user);
    }
    
    return preference;
  }

  /**
   * Create default preferences for user
   */
  async createDefault(userId, user) {
    const preference = new Preference({
      userId,
      channels: {
        email: {
          enabled: true,
          address: user.email,
          priority: 2,
        },
        webpush: {
          enabled: true,
          subscriptions: [],
          priority: 1,
        },
      },
    });
    
    return await preference.save();
  }

  /**
   * Update user preferences
   */
  async update(userId, updates) {
    return await Preference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
  }

  /**
   * Add web push subscription
   */
  async addWebPushSubscription(userId, subscription) {
    const preference = await this.getByUserId(userId);
    
    // Check if subscription already exists
    const exists = preference.channels.webpush.subscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      preference.channels.webpush.subscriptions.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      });
      await preference.save();
    }

    return preference;
  }

  /**
   * Remove web push subscription
   */
  async removeWebPushSubscription(userId, endpoint) {
    const preference = await this.getByUserId(userId);
    preference.channels.webpush.subscriptions = preference.channels.webpush.subscriptions.filter(
      (sub) => sub.endpoint !== endpoint
    );
    return await preference.save();
  }

  /**
   * Check if channel is enabled for user
   */
  async isChannelEnabled(userId, channel) {
    const preference = await this.getByUserId(userId);
    return preference.channels[channel]?.enabled || false;
  }

  /**
   * Get enabled channels in priority order
   */
  async getEnabledChannels(userId, channelHints = []) {
    const preference = await this.getByUserId(userId);
    const enabledChannels = [];

    // If channel hints provided, use those in order
    if (channelHints.length > 0) {
      for (const channel of channelHints) {
        if (preference.channels[channel]?.enabled) {
          enabledChannels.push(channel);
        }
      }
    } else {
      // Use fallback order from preferences
      const channels = Object.entries(preference.channels)
        .filter(([_, config]) => config.enabled)
        .sort(([_, a], [__, b]) => a.priority - b.priority)
        .map(([channel]) => channel);
      
      enabledChannels.push(...channels);
    }

    return enabledChannels;
  }

  /**
   * Check if in quiet hours
   */
  isQuietHours(preference) {
    if (!preference.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMin] = preference.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preference.quietHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    } else {
      return currentTime >= startTime && currentTime < endTime;
    }
  }
}

module.exports = new PreferenceService();







