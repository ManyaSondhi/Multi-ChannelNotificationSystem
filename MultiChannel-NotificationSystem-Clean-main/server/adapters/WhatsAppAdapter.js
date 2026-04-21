const twilio = require('twilio');
const BaseAdapter = require('./BaseAdapter');

class WhatsAppAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.client = null;
    this.initialize();
  }

  initialize() {
    try {
      if (this.config.accountSid && this.config.authToken) {
        this.client = twilio(this.config.accountSid, this.config.authToken);
        console.log("✅ Twilio WhatsApp client initialized successfully");
      } else {
        console.error("❌ Missing Twilio credentials in config");
      }
    } catch (error) {
      console.error('❌ WhatsApp adapter initialization error:', error);
    }
  }

  validate(payload) {
    const errors = [];
    if (!payload.to) errors.push('Recipient phone (to) is required');
    if (!payload.body) errors.push('WhatsApp message body is required');
    if (payload.body && payload.body.length > 1600) {
      errors.push('Message body exceeds maximum length of 1600 characters');
    }
    // Validate WhatsApp number format
    if (payload.to && !payload.to.startsWith('whatsapp:')) {
      // Allow phone numbers without whatsapp: prefix, we'll add it
      if (!payload.to.match(/^\+[1-9]\d{1,14}$/)) {
        errors.push('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
      }
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(payload, options = {}) {
    const validation = this.validate(payload);
    if (!validation.valid) {
      throw new Error(`WhatsApp message validation failed: ${validation.errors.join(', ')}`);
    }

    if (!this.client) {
      throw new Error('Twilio WhatsApp client not initialized. Check configuration.');
    }

    if (!this.config.whatsappNumber) {
      throw new Error('Twilio WhatsApp number not configured. Set TWILIO_WHATSAPP_NUMBER in environment variables.');
    }

    try {
      // Ensure phone number has whatsapp: prefix
      let toNumber = payload.to;
      if (!toNumber.startsWith('whatsapp:')) {
        toNumber = `whatsapp:${toNumber}`;
      }

      const fromNumber = this.config.whatsappNumber;
      
      console.log(`📱 Sending WhatsApp message from ${fromNumber} to ${toNumber}`);

      // Build status callback URL if BASE_URL is configured and publicly accessible
      const messageOptions = {
        from: fromNumber,
        to: toNumber,
        body: payload.body,
      };

      // Add status callback for delivery tracking only if BASE_URL is publicly accessible
      // Twilio cannot reach localhost URLs, so we skip the callback for local development
      if (this.config.baseUrl) {
        const baseUrl = this.config.baseUrl.toLowerCase();
        const isLocalhost = baseUrl.includes('localhost') || 
                           baseUrl.includes('127.0.0.1') || 
                           baseUrl.includes('0.0.0.0') ||
                           baseUrl.startsWith('http://localhost') ||
                           baseUrl.startsWith('http://127.0.0.1');
        
        if (!isLocalhost) {
          messageOptions.statusCallback = `${this.config.baseUrl}/api/webhooks/twilio/whatsapp-status`;
          console.log(`📡 Status callback URL: ${messageOptions.statusCallback}`);
        } else {
          console.log(`⚠️ Skipping status callback for localhost. For delivery tracking, use a publicly accessible URL (e.g., ngrok or deployed URL).`);
        }
      }

      const message = await this.client.messages.create(messageOptions);

      console.log(`✅ WhatsApp Message Sent! SID: ${message.sid}`);

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
      console.error('❌ WhatsApp Message Send Error:', error);
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
    return this.client !== null && !!this.config.whatsappNumber;
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

module.exports = WhatsAppAdapter;

