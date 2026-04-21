const User = require('../models/User');
const Preference = require('../models/Preference');
const logger = require('./logger');

const ensureDemoData = async () => {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  let admin = await User.findOne({ email: adminEmail }).select('+password');
  if (!admin) {
    admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    });
    logger.info(`Created demo admin user: ${adminEmail}`);
  } else {
    admin.password = adminPassword;
    await admin.save();
    logger.info(`Reset demo admin password: ${adminEmail}`);
  }

  const existingPref = await Preference.findOne({ userId: admin._id });
  if (!existingPref) {
    await Preference.create({
      userId: admin._id,
      channels: {
        email: {
          enabled: true,
          address: admin.email,
          priority: 2,
        },
        webpush: {
          enabled: true,
          subscriptions: [],
          priority: 1,
        },
      },
      fallbackOrder: ['webpush', 'email'],
    });
  }
};

module.exports = ensureDemoData;
