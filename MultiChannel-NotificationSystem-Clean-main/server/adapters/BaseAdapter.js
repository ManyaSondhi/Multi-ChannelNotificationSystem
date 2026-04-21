/**
 * Base class for all channel adapters
 * Provides consistent interface for all notification channels
 */
class BaseAdapter {
  constructor(config) {
    this.config = config;
    this.name = this.constructor.name;
  }

  /**
   * Send notification via this channel
   * @param {Object} payload - Channel-specific payload
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - { success: boolean, externalId: string, metadata: object }
   */
  async send(payload, options = {}) {
    throw new Error('send() method must be implemented by subclass');
  }

  /**
   * Validate payload before sending
   * @param {Object} payload - Channel-specific payload
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  validate(payload) {
    return { valid: true, errors: [] };
  }

  /**
   * Get channel-specific configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Test channel connectivity
   * @returns {Promise<boolean>}
   */
  async test() {
    return true;
  }
}

module.exports = BaseAdapter;







