require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Template = require('../models/Template');
const Preference = require('../models/Preference');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    await connectDB();

    // --- Clear existing data (optional) ---
    // await User.deleteMany({});
    // await Template.deleteMany({});
    // await Preference.deleteMany({});

    // --- Create admin user ---
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const admin = await User.create({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      });
      logger.info(`Created admin user: ${admin.email}`);
    } else {
      // Update password in case it was changed
      adminExists.password = 'admin123';
      await adminExists.save();
      logger.info(`Updated admin user password: ${adminExists.email}`);
    }

    // --- Create test user ---
    const userExists = await User.findOne({ email: 'user@example.com' });
    let testUser;
    if (!userExists) {
      testUser = await User.create({
        email: 'user@example.com',
        password: 'user123',
        name: 'Test User',
        phone: '+1234567890',
      });
      logger.info(`Created test user: ${testUser.email}`);
    } else {
      // Update password in case it was changed
      userExists.password = 'user123';
      await userExists.save();
      logger.info(`Updated test user password: ${userExists.email}`);
      testUser = userExists;
    }

    // --- Create default preferences ---
    const preferenceExists = await Preference.findOne({ userId: testUser._id });
    if (!preferenceExists) {
      await Preference.create({
        userId: testUser._id,
        channels: {
          email: {
            enabled: true,
            address: testUser.email,
            priority: 3,
          },
          sms: {
            enabled: true,
            phone: testUser.phone,
            priority: 2,
          },
          webpush: {
            enabled: true,
            subscriptions: [],
            priority: 1,
          },
        },
        fallbackOrder: ['webpush', 'sms', 'email'],
      });
      logger.info(`Created preferences for user: ${testUser.email}`);
    }

    // --- Create sample templates ---
    const templates = [
      {
        name: 'Welcome Email',
        code: 'WELCOME',
        description: 'Welcome email for new users',
        channels: {
          email: {
            enabled: true,
            subject: 'Welcome to {{appName}}, {{name}}!',
            html: `
              <h1>Welcome to {{appName}}!</h1>
              <p>Hi {{name}},</p>
              <p>Thank you for joining us. We're excited to have you on board!</p>
              <p>Your account has been created successfully.</p>
            `,
            text: 'Welcome to {{appName}}, {{name}}! Thank you for joining us.',
          },
          sms: {
            enabled: true,
            body: 'Welcome to {{appName}}, {{name}}! Your account has been created.',
          },
          whatsapp: {
            enabled: true,
            body: '🎉 Welcome to {{appName}}, {{name}}!\n\nThank you for joining us. We\'re excited to have you on board!\n\nYour account has been created successfully.',
          },
          webpush: {
            enabled: true,
            title: 'Welcome to {{appName}}!',
            body: 'Hi {{name}}, thank you for joining us!',
          },
        },
        variables: [
          { name: 'appName', description: 'Application name', required: true },
          { name: 'name', description: 'User name', required: true },
        ],
      },
      {
        name: 'Password Reset',
        code: 'PASSWORD_RESET',
        description: 'Password reset notification',
        channels: {
          email: {
            enabled: true,
            subject: 'Reset your password',
            html: `
              <h1>Password Reset Request</h1>
              <p>Hi {{name}},</p>
              <p>You requested to reset your password. Click the link below:</p>
              <p><a href="{{resetLink}}">Reset Password</a></p>
              <p>This link will expire in {{expiryMinutes}} minutes.</p>
            `,
            text: 'Hi {{name}}, reset your password: {{resetLink}}',
          },
          sms: {
            enabled: true,
            body: 'Password reset requested. Link: {{resetLink}}',
          },
          whatsapp: {
            enabled: true,
            body: '🔐 Password Reset Request\n\nHi {{name}},\n\nYou requested to reset your password. Click the link below:\n\n{{resetLink}}\n\nThis link will expire in {{expiryMinutes}} minutes.\n\nIf you didn\'t request this, please ignore this message.',
          },
          webpush: {
            enabled: true,
            title: 'Password Reset',
            body: 'Click to reset your password',
            data: { action: 'password-reset' },
          },
        },
        variables: [
          { name: 'name', description: 'User name', required: true },
          { name: 'resetLink', description: 'Reset password URL', required: true },
          { name: 'expiryMinutes', description: 'Link expiration time', required: false },
        ],
      },
      {
        name: 'Order Confirmation',
        code: 'ORDER_CONFIRMATION',
        description: 'Order confirmation notification',
        channels: {
          email: {
            enabled: true,
            subject: 'Order #{{orderNumber}} confirmed',
            html: `
              <h1>Order Confirmed!</h1>
              <p>Hi {{name}},</p>
              <p>Your order #{{orderNumber}} has been confirmed.</p>
              <p>Total: ${'$'}{{total}}</p>
              <p>Thank you for your purchase!</p>
            `,
            text: 'Order #{{orderNumber}} confirmed. Total: ${{total}}',
          },
          sms: {
            enabled: true,
            body: 'Order #{{orderNumber}} confirmed. Total: ${{total}}',
          },
          whatsapp: {
            enabled: true,
            body: '✅ Order Confirmed!\n\nHi {{name}},\n\nYour order #{{orderNumber}} has been confirmed.\n\nTotal: ${{total}}\n\nThank you for your purchase! 🎉',
          },
          webpush: {
            enabled: true,
            title: 'Order Confirmed',
            body: 'Order #{{orderNumber}} - ${{total}}',
            data: { orderNumber: '{{orderNumber}}' },
          },
        },
        variables: [
          { name: 'name', description: 'Customer name', required: true },
          { name: 'orderNumber', description: 'Order number', required: true },
          { name: 'total', description: 'Order total', required: true },
        ],
      },
    ];

    for (const templateData of templates) {
      const existing = await Template.findOne({ code: templateData.code });
      if (!existing) {
        const template = await Template.create({
          ...templateData,
          createdBy: testUser._id,
        });
        logger.info(`Created template: ${template.code}`);
      }
    }

    logger.info('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Seed error: ${error.message}`, error);
    process.exit(1);
  }
};

seedData();
