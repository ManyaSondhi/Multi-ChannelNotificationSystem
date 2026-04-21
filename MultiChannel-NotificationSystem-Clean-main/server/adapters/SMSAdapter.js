const twilio = require('twilio');
const BaseAdapter = require('./BaseAdapter');

class SMSAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.initialize();
  }

  initialize() {
    try {
      if (this.config.accountSid && this.config.authToken) {
        this.client = twilio(this.config.accountSid, this.config.authToken);
        console.log("✅ Twilio client initialized successfully");
      } else {
        console.error("❌ Missing Twilio credentials in config");
      }
    } catch (error) {
      console.error('❌ SMS adapter initialization error:', error);
    }
  }

  validate(payload) {
    const errors = [];
    if (!payload.to) errors.push('Recipient phone (to) is required');
    if (!payload.body) errors.push('SMS body is required');
    if (payload.body && payload.body.length > 1600) {
      errors.push('Message body exceeds maximum length of 1600 characters');
    }
    // Validate phone number format (E.164 format)
    if (payload.to && !payload.to.match(/^\+[1-9]\d{1,14}$/)) {
      errors.push('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(payload, options = {}) {
    const validation = this.validate(payload);
    if (!validation.valid) {
      throw new Error(`SMS validation failed: ${validation.errors.join(', ')}`);
    }

    if (!this.client) {
      throw new Error('Twilio client not initialized. Check configuration.');
    }

    if (!this.config.phoneNumber) {
      throw new Error('Twilio phone number not configured. Set TWILIO_PHONE_NUMBER in environment variables.');
    }

    try {
      const fromNumber = this.config.phoneNumber;
      const toNumber = payload.to;

      console.log(`📨 Sending SMS from ${fromNumber} to ${toNumber}`);

      const message = await this.client.messages.create({
        body: payload.body,
        from: fromNumber,
        to: toNumber,
      });

      console.log(`✅ SMS Sent! SID: ${message.sid}`);

      return {
        success: true,
        externalId: message.sid,
        metadata: {
          sid: message.sid,
          status: message.status,
          price: message.price,
          priceUnit: message.priceUnit,
          uri: message.uri,
          from: message.from,
          to: message.to,
        },
      };
    } catch (error) {
      console.error('❌ SMS Send Error:', error);
      return {
        success: false,
        externalId: null,
        error: error.message,
        errorCode: error.code,
        metadata: {
          status: error.status,
          moreInfo: error.moreInfo,
          code: error.code,
        },
      };
    }
  }

  async test() {
    return this.client !== null && !!this.config.phoneNumber;
  }

  verifyWebhook(url, params, signature) {
    if (!this.config.authToken) return false;
    return twilio.validateRequest(
      this.config.authToken,
      signature,
      url,
      params
    );
  }
}

module.exports = SMSAdapter;
