const nodemailer = require('nodemailer');
const BaseAdapter = require('./BaseAdapter');
const DeliveryLog = require('../models/DeliveryLog');
const logger = require('../utils/logger');

class EmailAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      });
    } catch (error) {
      console.error('Email adapter initialization error:', error);
    }
  }

  validate(payload) {
    const errors = [];
    if (!payload.to) errors.push('Recipient email (to) is required');
    if (!payload.subject) errors.push('Email subject is required');
    if (!payload.html && !payload.text) {
      errors.push('Email body (html or text) is required');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(payload, options = {}) {
    const validation = this.validate(payload);
    if (!validation.valid) {
      throw new Error(`Email validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const mailOptions = {
        from: payload.from || this.config.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.html?.replace(/<[^>]*>/g, ''),
        replyTo: payload.replyTo,
        cc: payload.cc,
        bcc: payload.bcc,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent successfully! MessageId: ${info.messageId}`);

      // Simulate delivery tracking: update delivery log to "delivered" after 5 seconds
      // The delivery log will be created by NotificationService with status "sent"
      // We'll update it to "delivered" after a delay
      if (info.messageId && options.notificationId) {
        setTimeout(async () => {
          try {
            // Find the delivery log by externalId (messageId) and notificationId
            const deliveryLog = await DeliveryLog.findOne({
              externalId: info.messageId,
              notificationId: options.notificationId,
              channel: 'email',
            });

            if (deliveryLog && deliveryLog.status === 'sent') {
              console.log(`📬 Simulating email delivery: Updating delivery log ${deliveryLog._id} to "delivered"`);
              
              deliveryLog.status = 'delivered';
              deliveryLog.timeline.push({
                status: 'delivered',
                timestamp: new Date(),
                message: 'Email delivered (simulated)',
                metadata: {
                  simulated: true,
                  deliveryTime: new Date().toISOString(),
                },
              });
              await deliveryLog.save();

              logger.info(`✅ Updated email delivery log ${deliveryLog._id} to status: delivered`);

              // Also update the notification delivery status
              const Notification = require('../models/Notification');
              const notification = await Notification.findById(options.notificationId);
              if (notification) {
                const delivery = notification.deliveries.find(
                  (d) => d.externalId === info.messageId
                );
                if (delivery) {
                  delivery.status = 'delivered';
                  await notification.save();
                  logger.info(`✅ Updated notification ${notification._id} email delivery status to: delivered`);
                }
              }
            }
          } catch (error) {
            logger.error(`Error updating email delivery status: ${error.message}`, error);
          }
        }, 5000); // 5 seconds delay
      }
      
      return {
        success: true,
        externalId: info.messageId,
        metadata: {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
        },
      };
    } catch (error) {
      return {
        success: false,
        externalId: null,
        error: error.message,
        errorCode: error.code,
        metadata: {
          stack: error.stack,
        },
      };
    }
  }

  async test() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email adapter test failed:', error);
      return false;
    }
  }
}

module.exports = EmailAdapter;







