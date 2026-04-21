require('dotenv').config();
const mongoose = require('mongoose');

const debugConnection = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notificationsystem';
    console.log('\n=== Connection Debug ===');
    console.log('MONGODB_URI:', uri);
    
    // Parse the URI
    const url = new URL(uri);
    console.log('Host:', url.hostname);
    console.log('Port:', url.port || '27017');
    console.log('Database:', url.pathname.substring(1) || 'default');
    
    // Connect
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n=== Connection Status ===');
    console.log('Connected to:', mongoose.connection.host);
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('   (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)');
    
    // List all databases
    console.log('\n=== All Databases on Server ===');
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log('Total databases:', dbList.databases.length);
    dbList.databases.forEach(db => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check current database
    console.log('\n=== Current Database Info ===');
    const dbName = mongoose.connection.db.databaseName;
    console.log('Database:', dbName);
    
    // List collections
    console.log('\n=== Collections in', dbName, '===');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check templates collection directly
    console.log('\n=== Templates Collection Debug ===');
    const templatesCollection = mongoose.connection.db.collection('templates');
    
    // Get collection stats
    try {
      const stats = await templatesCollection.stats();
      console.log('Collection exists: YES');
      console.log('Document count (stats):', stats.count);
      console.log('Collection size:', stats.size, 'bytes');
      console.log('Average document size:', stats.avgObjSize, 'bytes');
    } catch (err) {
      console.log('Collection exists: NO');
      console.log('Error:', err.message);
    }
    
    // Count documents
    const count = await templatesCollection.countDocuments({});
    console.log('Document count (countDocuments):', count);
    
    // Try to find documents
    const docs = await templatesCollection.find({}).limit(5).toArray();
    console.log('Documents found (find):', docs.length);
    
    if (docs.length > 0) {
      console.log('\n=== Sample Documents ===');
      docs.forEach((doc, i) => {
        console.log(`${i + 1}. Code: ${doc.code}, Name: ${doc.name}`);
        console.log(`   ID: ${doc._id}`);
        console.log(`   Created: ${doc.createdAt}`);
      });
    } else {
      console.log('\n⚠️  No documents found, but collection exists!');
      console.log('This might be a view or the collection is truly empty.');
    }
    
    // Try using Mongoose model
    console.log('\n=== Using Mongoose Model ===');
    const Template = require('../models/Template');
    const mongooseCount = await Template.countDocuments();
    console.log('Mongoose countDocuments():', mongooseCount);
    
    if (mongooseCount > 0) {
      const mongooseDocs = await Template.find({}).limit(3).lean();
      console.log('Mongoose find() returned:', mongooseDocs.length, 'documents');
      mongooseDocs.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.code} - ${doc.name}`);
      });
    }
    
    // Final verification
    console.log('\n=== Final Verification ===');
    console.log('If Mongoose shows documents but raw collection shows 0:');
    console.log('  - There might be a schema/validation issue');
    console.log('  - Documents might be in a different collection');
    console.log('  - There might be a view or aggregation pipeline');
    
    console.log('\nIf both show 0 but scripts say they created documents:');
    console.log('  - Documents might be in a different database');
    console.log('  - MongoDB Compass might be connected to a different instance');
    console.log('  - There might be multiple MongoDB instances running');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

debugConnection();

