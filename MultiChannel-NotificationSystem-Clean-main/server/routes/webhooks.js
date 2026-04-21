const express = require('express');
const DeliveryLog = require('../models/DeliveryLog');
const Notification = require('../models/Notification');
const { createAdapters } = require('../adapters');
const { validations } = require('../middleware/validation');
const logger = require('../utils/logger');
const router = express.Router();

const adapters = createAdapters(process.env);

/**
 * Twilio webhook for SMS delivery status
 */
router.post(
  '/twilio',
  validations.twilioWebhook,
  async (req, res, next) => {
    try {
      // Verify webhook signature (optional but recommended)
      const signature = req.headers['x-twilio-signature'];
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      
      // For production, verify signature
      if (process.env.NODE_ENV === 'production' && signature) {
        const isValid = adapters.sms.verifyWebhook(url, req.body, signature);
        if (!isValid) {
          logger.warn('Invalid Twilio webhook signature');
          return res.status(401).send('Unauthorized');
        }
      }

      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      if (!MessageSid) {
        return res.status(400).json({ error: 'MessageSid required' });
      }

      // Find delivery log by external ID
      const log = await DeliveryLog.findOne({ externalId: MessageSid });
      if (!log) {
        logger.warn(`Delivery log not found for Twilio SID: ${MessageSid}`);
        return res.status(200).send('OK'); // Still return 200 to Twilio
      }

      // Map Twilio status to our status
      const statusMap = {
        queued: 'sent',
        sent: 'sent',
        delivered: 'delivered',
        undelivered: 'failed',
        failed: 'failed',
      };

      const newStatus = statusMap[MessageStatus] || 'failed';

      // Update delivery log
      log.status = newStatus;
      log.error = ErrorMessage || log.error;
      log.errorCode = ErrorCode || log.errorCode;
      log.timeline.push({
        status: newStatus,
        timestamp: new Date(),
        message: `Twilio status update: ${MessageStatus}`,
        metadata: req.body,
      });
      await log.save();

      // Update notification delivery status
      const notification = await Notification.findById(log.notificationId);
      if (notification) {
        const delivery = notification.deliveries.find(
          (d) => d.externalId === MessageSid
        );
        if (delivery) {
          delivery.status = newStatus;
          if (ErrorMessage) {
            delivery.error = ErrorMessage;
          }
          await notification.save();
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error(`Twilio webhook error: ${error.message}`, error);
      next(error);
    }
  }
);

/**
 * Twilio webhook for WhatsApp delivery status
 */
router.post(
  '/twilio/whatsapp-status',
  validations.twilioWebhook,
  async (req, res, next) => {
    try {
      // Verify webhook signature (optional but recommended)
      const signature = req.headers['x-twilio-signature'];
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      
      // For production, verify signature
      if (process.env.NODE_ENV === 'production' && signature) {
        const isValid = adapters.whatsapp.verifyWebhook(url, req.body, signature);
        if (!isValid) {
          logger.warn('Invalid Twilio WhatsApp webhook signature');
          return res.status(401).send('Unauthorized');
        }
      }

      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      console.log(`📱 WhatsApp Status Webhook received:`, {
        MessageSid,
        MessageStatus,
        ErrorCode,
        ErrorMessage,
      });

      if (!MessageSid) {
        logger.warn('WhatsApp webhook received without MessageSid');
        return res.status(200).send('OK'); // Still return 200 to Twilio
      }

      // Find delivery log by external ID (MessageSid)
      const log = await DeliveryLog.findOne({ externalId: MessageSid });
      if (!log) {
        logger.warn(`Delivery log not found for WhatsApp MessageSid: ${MessageSid}`);
        return res.status(200).send('OK'); // Still return 200 to Twilio
      }

      // Map Twilio status to our status
      const statusMap = {
        queued: 'sent',
        sent: 'sent',
        delivered: 'delivered',
        undelivered: 'failed',
        failed: 'failed',
      };

      const newStatus = statusMap[MessageStatus] || 'failed';

      console.log(`📊 Updating WhatsApp delivery log ${log._id}: ${log.status} → ${newStatus}`);

      // Update delivery log
      log.status = newStatus;
      if (ErrorMessage) {
        log.error = ErrorMessage;
      }
      if (ErrorCode) {
        log.errorCode = ErrorCode;
      }
      log.timeline.push({
        status: newStatus,
        timestamp: new Date(),
        message: `Twilio WhatsApp status update: ${MessageStatus}`,
        metadata: req.body,
      });
      await log.save();

      logger.info(`✅ Updated WhatsApp delivery log ${log._id} to status: ${newStatus}`);

      // Update notification delivery status
      const notification = await Notification.findById(log.notificationId);
      if (notification) {
        const delivery = notification.deliveries.find(
          (d) => d.externalId === MessageSid
        );
        if (delivery) {
          delivery.status = newStatus;
          if (ErrorMessage) {
            delivery.error = ErrorMessage;
          }
          await notification.save();
          logger.info(`✅ Updated notification ${notification._id} delivery status to: ${newStatus}`);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      logger.error(`WhatsApp webhook error: ${error.message}`, error);
      // Still return 200 to Twilio even on error to prevent retries
      res.status(200).send('OK');
    }
  }
);

/**
 * Generic delivery status webhook
 */
router.post('/delivery/:correlationId/:channel', async (req, res, next) => {
  try {
    const { correlationId, channel } = req.params;
    const { status, externalId, error, metadata } = req.body;

    if (!['sent', 'delivered', 'failed', 'bounced'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find delivery log
    const log = await DeliveryLog.findOne({ correlationId, channel });
    if (!log) {
      return res.status(404).json({ error: 'Delivery log not found' });
    }

    // Update log
    log.status = status;
    if (error) log.error = error;
    if (metadata) log.metadata = { ...log.metadata, ...metadata };
    log.timeline.push({
      status,
      timestamp: new Date(),
      message: 'Status update via webhook',
      metadata: req.body,
    });
    await log.save();

    // Update notification
    const notification = await Notification.findById(log.notificationId);
    if (notification) {
      const delivery = notification.deliveries.find(
        (d) => d.channel === channel && d.correlationId === correlationId
      );
      if (delivery) {
        delivery.status = status;
        if (error) delivery.error = error;
        await notification.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;







