const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'webpush'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'undelivered'],
      required: true,
      index: true,
    },
    externalId: String, // Twilio SID, email message ID, etc.
    provider: String, // 'twilio', 'nodemailer', 'web-push'
    attempts: {
      type: Number,
      default: 0,
    },
    error: String,
    errorCode: String,
    metadata: mongoose.Schema.Types.Mixed,
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        message: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    latency: Number, // milliseconds
    cost: Number, // for paid channels like SMS
  },
  {
    timestamps: true,
  }
);

deliveryLogSchema.index({ userId: 1, createdAt: -1 });
deliveryLogSchema.index({ channel: 1, status: 1, createdAt: -1 });
deliveryLogSchema.index({ correlationId: 1, channel: 1 });

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);







