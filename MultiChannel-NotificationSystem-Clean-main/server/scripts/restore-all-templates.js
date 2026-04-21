require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Template = require('../models/Template');
const User = require('../models/User');

const restoreTemplates = async () => {
  try {
    await connectDB();
    
    console.log('\n=== Restoring All Templates ===');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Get admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne({ email: 'admin@example.com' });
    }
    if (!admin) {
      console.log('Creating admin user...');
      admin = await User.create({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      });
    }
    console.log('Using admin user:', admin.email);
    
    // Define ALL templates (including the ones that were deleted)
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
      {
        name: 'Special Offer',
        code: 'SPECIAL_OFFER',
        description: 'Special offer notification',
        channels: {
          email: {
            enabled: true,
            subject: 'Special Offer: {{data.discount}}% Off!',
            html: `
              <h1>Special Offer for You!</h1>
              <p>Hi {{name}},</p>
              <p>We have a special offer just for you!</p>
              <p>Get {{data.discount}}% off on your next purchase.</p>
              <p>Use code: <strong>{{data.couponCode}}</strong></p>
              <p>Valid until: {{data.validUntil}}</p>
              <p><a href="{{data.offerLink}}">Claim Your Offer</a></p>
            `,
            text: 'Special Offer: {{data.discount}}% off! Use code: {{data.couponCode}}',
          },
          sms: {
            enabled: true,
            body: 'Special Offer: {{data.discount}}% off! Use code: {{data.couponCode}}. Valid until {{data.validUntil}}',
          },
          whatsapp: {
            enabled: true,
            body: '🎁 Special Offer!\n\nHi {{name}},\n\nGet {{data.discount}}% off on your next purchase!\n\nUse code: {{data.couponCode}}\n\nValid until: {{data.validUntil}}\n\n{{data.offerLink}}',
          },
          webpush: {
            enabled: true,
            title: 'Special Offer: {{data.discount}}% Off!',
            body: 'Use code: {{data.couponCode}}',
            data: { couponCode: '{{data.couponCode}}', discount: '{{data.discount}}' },
          },
        },
        variables: [
          { name: 'name', description: 'Customer name', required: true },
          { name: 'data.discount', description: 'Discount percentage', required: true },
          { name: 'data.couponCode', description: 'Coupon code', required: true },
          { name: 'data.validUntil', description: 'Offer expiration date', required: true },
          { name: 'data.offerLink', description: 'Offer link URL', required: false },
        ],
      },
      {
        name: 'Session Reminder',
        code: 'SESSION_REMINDER',
        description: 'Session reminder notification',
        channels: {
          email: {
            enabled: true,
            subject: 'Reminder: Your session is coming up',
            html: `
              <h1>Session Reminder</h1>
              <p>Hi {{name}},</p>
              <p>This is a reminder that your session is scheduled for:</p>
              <p><strong>Date:</strong> {{data.sessionDate}}</p>
              <p><strong>Time:</strong> {{data.sessionTime}}</p>
              <p><strong>Location:</strong> {{data.sessionLocation}}</p>
              <p>We look forward to seeing you!</p>
            `,
            text: 'Reminder: Your session on {{data.sessionDate}} at {{data.sessionTime}}',
          },
          sms: {
            enabled: true,
            body: 'Reminder: Your session is on {{data.sessionDate}} at {{data.sessionTime}}. Location: {{data.sessionLocation}}',
          },
          whatsapp: {
            enabled: true,
            body: '📅 Session Reminder\n\nHi {{name}},\n\nYour session is scheduled for:\n\nDate: {{data.sessionDate}}\nTime: {{data.sessionTime}}\nLocation: {{data.sessionLocation}}\n\nWe look forward to seeing you!',
          },
          webpush: {
            enabled: true,
            title: 'Session Reminder',
            body: 'Your session is on {{data.sessionDate}} at {{data.sessionTime}}',
            data: { sessionDate: '{{data.sessionDate}}', sessionTime: '{{data.sessionTime}}' },
          },
        },
        variables: [
          { name: 'name', description: 'User name', required: true },
          { name: 'data.sessionDate', description: 'Session date', required: true },
          { name: 'data.sessionTime', description: 'Session time', required: true },
          { name: 'data.sessionLocation', description: 'Session location', required: false },
        ],
      },
    ];
    
    console.log('\nProcessing templates...');
    let created = 0;
    let updated = 0;
    
    for (const templateData of templates) {
      // Check if template exists
      const existing = await Template.findOne({ code: templateData.code });
      
      if (existing) {
        // Update existing template (preserve ID and timestamps)
        Object.assign(existing, templateData, {
          createdBy: admin._id,
          updatedAt: new Date(),
        });
        await existing.save();
        console.log(`✅ Updated: ${existing.code} - ${existing.name}`);
        updated++;
      } else {
        // Create new template
        const template = await Template.create({
          ...templateData,
          createdBy: admin._id,
        });
        console.log(`✅ Created: ${template.code} - ${template.name}`);
        created++;
      }
    }
    
    // Verify all templates
    console.log('\n=== Final Verification ===');
    const allTemplates = await Template.find({}).sort({ code: 1 });
    console.log(`Total templates: ${allTemplates.length}`);
    console.log('\nAll templates:');
    allTemplates.forEach((t, i) => {
      console.log(`${i + 1}. ${t.code} - ${t.name}`);
      console.log(`   ID: ${t._id}`);
      console.log(`   Created: ${t.createdAt}`);
    });
    
    // Remove test template if it exists
    const testTemplate = await Template.findOne({ code: /^TEST_/ });
    if (testTemplate) {
      await Template.deleteOne({ _id: testTemplate._id });
      console.log(`\n🗑️  Removed test template: ${testTemplate.code}`);
    }
    
    console.log(`\n✅ Restore complete!`);
    console.log(`   Created: ${created} templates`);
    console.log(`   Updated: ${updated} templates`);
    console.log(`   Total: ${allTemplates.length} templates`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

restoreTemplates();

