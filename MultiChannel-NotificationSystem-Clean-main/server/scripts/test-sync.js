/**
 * Test script to manually sync templates to JSON file
 * Run: node server/scripts/test-sync.js
 */

require('dotenv').config();
const path = require('path');

// Set up the database connection first
const connectDB = require('../config/database');
const { syncTemplatesToFile } = require('../utils/templatesSync');

async function testSync() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    
    console.log('🔄 Syncing templates to templates.json...');
    const result = await syncTemplatesToFile();
    
    if (result.success) {
      console.log(`✅ Success! Synced ${result.count} templates to ${result.filePath}`);
      process.exit(0);
    } else {
      console.error(`❌ Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSync();

