/**
 * Script to sync all templates from MongoDB to templates.json
 * This can be run manually or automatically after template changes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const { syncTemplatesToFile } = require('../utils/templatesSync');
const logger = require('../utils/logger');

async function main() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notificationsystem';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('Connected to MongoDB');
    
    // Sync templates to JSON file
    const result = await syncTemplatesToFile();
    
    if (result.success) {
      logger.info(`✅ Successfully synced ${result.count} templates to templates.json`);
      console.log(`✅ Successfully synced ${result.count} templates to templates.json`);
    } else {
      logger.error(`❌ Failed to sync templates: ${result.error}`);
      console.error(`❌ Failed to sync templates: ${result.error}`);
      process.exit(1);
    }
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Error: ${error.message}`, { stack: error.stack });
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();

