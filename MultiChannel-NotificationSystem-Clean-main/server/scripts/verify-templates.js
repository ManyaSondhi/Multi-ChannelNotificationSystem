require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Template = require('../models/Template');

const verify = async () => {
  try {
    await connectDB();
    
    console.log('\n=== MongoDB Connection ===');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    console.log('\n=== Using Mongoose Model ===');
    const mongooseCount = await Template.countDocuments();
    console.log('Template count (Mongoose):', mongooseCount);
    
    if (mongooseCount > 0) {
      const templates = await Template.find({}).lean();
      templates.forEach((t, i) => {
        console.log(`${i+1}. ${t.code} - ${t.name}`);
        console.log(`   ID: ${t._id}`);
        console.log(`   Created: ${t.createdAt}`);
      });
    }
    
    console.log('\n=== Using Raw MongoDB Collection ===');
    const collection = mongoose.connection.db.collection('templates');
    const rawCount = await collection.countDocuments();
    console.log('Template count (Raw):', rawCount);
    
    if (rawCount > 0) {
      const rawDocs = await collection.find({}).limit(1).toArray();
      console.log('Sample document keys:', Object.keys(rawDocs[0] || {}));
    }
    
    console.log('\n=== Collection Stats ===');
    const stats = await mongoose.connection.db.stats();
    console.log('Database collections:', stats.collections);
    
    const collStats = await collection.stats();
    console.log('Templates collection size:', collStats.size, 'bytes');
    console.log('Templates collection count:', collStats.count);
    console.log('Templates collection avgObjSize:', collStats.avgObjSize, 'bytes');
    
    console.log('\n✅ Verification complete!');
    console.log('\nIf MongoDB Compass shows 0 documents but the script shows documents exist:');
    console.log('1. Refresh MongoDB Compass (click the refresh button)');
    console.log('2. Close and reopen the templates collection');
    console.log('3. Check if you are viewing the correct database: notificationsystem');
    console.log('4. Try restarting MongoDB Compass');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

verify();

