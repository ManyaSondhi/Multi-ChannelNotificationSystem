const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const notificationSchema = new mongoose.Schema(
  {
    correlationId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    templateCode: {
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
    audience: {
      type: String,
      enum: ['single', 'bulk'],
      default: 'single',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    channelHints: {
      type: [String],
      enum: ['email', 'webpush'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed', 'partial'],
      default: 'pending',
      index: true,
    },
    deliveries: [
      {
        channel: {
          type: String,
          enum: ['email', 'webpush'],
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
          default: 'pending',
        },
        externalId: String, // Twilio SID, email message ID, etc.
        attempts: {
          type: Number,
          default: 0,
        },
        lastAttemptAt: Date,
        error: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],
    sentAt: Date,
    completedAt: Date,
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ correlationId: 1, userId: 1, 'deliveries.channel': 1 }); // For idempotency

module.exports = mongoose.model('Notification', notificationSchema);

