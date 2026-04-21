const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    channels: {
      email: {
        enabled: { type: Boolean, default: false },
        subject: String,
        html: String,
        text: String,
      },
      webpush: {
        enabled: { type: Boolean, default: false },
        title: String,
        body: String,
        icon: String,
        badge: String,
        data: mongoose.Schema.Types.Mixed,
        actions: [
          {
            action: String,
            title: String,
            icon: String,
          },
        ],
      },
    },
    variables: [
      {
        name: String,
        description: String,
        required: { type: Boolean, default: false },
      },
    ],
    locales: {
      type: Map,
      of: {
        email: {
          subject: String,
          html: String,
          text: String,
        },
        webpush: {
          title: String,
          body: String,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ code: 1, version: 1 });
templateSchema.index({ isActive: 1 });

module.exports = mongoose.model('Template', templateSchema);







