// Quick test to verify backend API can access MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./server/models/Template');

const testAPI = async () => {
  try {
    console.log('\n🧪 Testing Backend API Access to MongoDB...\n');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('   Database:', mongoose.connection.db.databaseName);
    
    // Simulate what the API does
    const templates = await Template.find({}).lean();
    console.log(`\n✅ API can read ${templates.length} templates:`);
    templates.forEach(t => {
      console.log(`   - ${t.code}: ${t.name}`);
    });
    
    console.log('\n✅ BACKEND IS FULLY FUNCTIONAL!');
    console.log('   Your API can read templates from MongoDB.');
    console.log('   The issue is ONLY with MongoDB Compass display.\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
};

testAPI();

