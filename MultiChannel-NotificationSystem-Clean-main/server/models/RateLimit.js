const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    }, // userId or userId:channel
    type: {
      type: String,
      enum: ['user', 'user_channel'],
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    windowStart: {
      type: Date,
      required: true,
      index: true,
    },
    windowEnd: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

rateLimitSchema.index({ identifier: 1, windowEnd: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RateLimit', rateLimitSchema);







