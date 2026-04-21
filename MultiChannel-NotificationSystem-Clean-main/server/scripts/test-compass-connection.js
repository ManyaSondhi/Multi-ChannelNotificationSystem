require('dotenv').config();
const mongoose = require('mongoose');

// This script creates a test document that MongoDB Compass should immediately see
const testCompass = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Get the templates collection directly
    const collection = mongoose.connection.db.collection('templates');
    
    // Insert a test document with a very unique code
    const testDoc = {
      name: 'TEST_COMPASS_VISIBILITY',
      code: 'TEST_' + Date.now(),
      description: 'This is a test document to verify MongoDB Compass can see it',
      channels: {
        email: {
          enabled: true,
          subject: 'Test',
          html: '<p>Test</p>',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('\nInserting test document...');
    const result = await collection.insertOne(testDoc);
    console.log('✅ Inserted test document with ID:', result.insertedId);
    
    // Immediately verify it exists
    const count = await collection.countDocuments({ code: testDoc.code });
    console.log('✅ Verified document exists (count:', count, ')');
    
    // Get all documents
    const allDocs = await collection.find({}).toArray();
    console.log('\n=== All Documents in Collection ===');
    console.log('Total documents:', allDocs.length);
    allDocs.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.code} - ${doc.name}`);
    });
    
    console.log('\n=== MongoDB Compass Instructions ===');
    console.log('1. In MongoDB Compass, click the REFRESH button (circular arrow)');
    console.log('2. Or disconnect and reconnect to localhost:27017');
    console.log('3. Navigate to: notificationsystem > templates');
    console.log('4. You should see', allDocs.length, 'documents');
    console.log('5. Look for the test document:', testDoc.code);
    
    console.log('\n=== Connection String for MongoDB Compass ===');
    console.log('Use this exact connection string in MongoDB Compass:');
    console.log('mongodb://localhost:27017/notificationsystem');
    console.log('\nOr connect to: localhost:27017');
    console.log('Then select database: notificationsystem');
    console.log('Then select collection: templates');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testCompass();

