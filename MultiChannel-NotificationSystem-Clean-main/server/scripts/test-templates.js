require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const TemplateService = require('../services/TemplateService');

async function test() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notificationsystem';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');

    // Test direct query
    const directTemplates = await Template.find({}).sort({ name: 1 });
    console.log('Direct query found:', directTemplates.length, 'templates');

    // Test service
    const serviceTemplates = await TemplateService.getAll({});
    console.log('Service query found:', serviceTemplates.length, 'templates');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();

