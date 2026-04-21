require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Template = require('../models/Template');
const logger = require('../utils/logger');

const checkAndFix = async () => {
  try {
    await connectDB();
    
    console.log('\n=== Connection Info ===');
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Connection string:', mongoose.connection.host);
    
    // List all collections
    console.log('\n=== All Collections ===');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log('-', col.name);
    });
    
    // Check template count
    console.log('\n=== Template Count ===');
    const count = await Template.countDocuments();
    console.log('Templates found:', count);
    
    if (count === 0) {
      console.log('\n⚠️  Templates collection is empty! Creating templates...\n');
      
      // Get or create admin user
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
        console.log('✅ Created admin user:', admin.email);
      } else {
        console.log('✅ Using admin user:', admin.email);
      }
      
      // Create templates
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
        // Delete if exists (in case of issues)
        await Template.deleteMany({ code: templateData.code });
        
        // Create new template
        const template = await Template.create({
          ...templateData,
          createdBy: admin._id,
        });
        console.log(`✅ Created template: ${template.code} (${template.name})`);
      }
      
      const finalCount = await Template.countDocuments();
      console.log(`\n✅ Successfully created ${finalCount} templates!`);
      
      // Show all templates
      console.log('\n=== All Templates ===');
      const allTemplates = await Template.find({});
      allTemplates.forEach(t => {
        console.log(`- ${t.code}: ${t.name}`);
      });
    } else {
      console.log('\n✅ Templates already exist!');
      const allTemplates = await Template.find({});
      allTemplates.forEach(t => {
        console.log(`- ${t.code}: ${t.name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

checkAndFix();

