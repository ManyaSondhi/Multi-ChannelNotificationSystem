require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Template = require('../models/Template');
const User = require('../models/User');

const forceInsert = async () => {
  try {
    await connectDB();
    
    console.log('\n=== Force Inserting Templates ===');
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
    
    // Delete all existing templates first
    console.log('\nDeleting all existing templates...');
    const deleteResult = await Template.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} templates`);
    
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
        createdBy: admin._id,
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
        createdBy: admin._id,
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
        createdBy: admin._id,
      },
    ];
    
    console.log('\nCreating templates...');
    for (const templateData of templates) {
      const template = await Template.create(templateData);
      console.log(`✅ Created: ${template.code} - ${template.name} (ID: ${template._id})`);
    }
    
    // Verify using both Mongoose and raw collection
    console.log('\n=== Verification ===');
    const mongooseCount = await Template.countDocuments();
    console.log('Mongoose count:', mongooseCount);
    
    const rawCount = await mongoose.connection.db.collection('templates').countDocuments();
    console.log('Raw MongoDB count:', rawCount);
    
    if (rawCount > 0) {
      const rawDocs = await mongoose.connection.db.collection('templates').find({}).toArray();
      console.log('\n✅ Templates in database:');
      rawDocs.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.code} - ${doc.name}`);
        console.log(`   ID: ${doc._id}`);
      });
    }
    
    console.log('\n✅ Force insert complete!');
    console.log('\nNow refresh MongoDB Compass to see the templates.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

forceInsert();

