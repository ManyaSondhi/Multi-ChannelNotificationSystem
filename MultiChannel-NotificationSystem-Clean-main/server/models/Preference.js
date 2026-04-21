const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    channels: {
      email: {
        enabled: { type: Boolean, default: true },
        address: { type: String, trim: true },
        priority: { type: Number, default: 2 },
      },
      webpush: {
        enabled: { type: Boolean, default: true },
        subscriptions: [
          {
            endpoint: String,
            keys: {
              p256dh: String,
              auth: String,
            },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        priority: { type: Number, default: 1 },
      },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' }, // HH:mm format
      end: { type: String, default: '08:00' },
      timezone: { type: String, default: 'UTC' },
    },
    fallbackOrder: {
      type: [String],
      enum: ['webpush', 'email'],
      default: ['webpush', 'email'],
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

preferenceSchema.index({ userId: 1 });

module.exports = mongoose.model('Preference', preferenceSchema);







