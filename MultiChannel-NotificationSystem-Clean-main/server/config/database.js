const mongoose = require('mongoose');
const logger = require('../utils/logger');

let memoryServer = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notificationsystem';

  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  // Add connection timeout for Docker
  if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true') {
    options.serverSelectionTimeoutMS = 30000; // 30 seconds
    options.connectTimeoutMS = 30000;
  }

  const setupListeners = () => {
    mongoose.connection.removeAllListeners('error');
    mongoose.connection.removeAllListeners('disconnected');
    mongoose.connection.removeAllListeners('reconnected');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
    setupListeners();
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);

    // Fall back to in-memory Mongo in local development only.
    const canUseInMemory =
      process.env.NODE_ENV !== 'production' && process.env.DOCKER_ENV !== 'true';

    if (!canUseInMemory) {
      logger.error('Please ensure MongoDB is running and accessible');
      throw error;
    }

    logger.warn('Falling back to in-memory MongoDB for local development');

    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'notificationsystem' },
    });

    const memoryUri = memoryServer.getUri();
    process.env.MONGODB_URI = memoryUri;

    const conn = await mongoose.connect(memoryUri, options);
    logger.info(`In-memory MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
    setupListeners();
    return conn;
  }
};

process.on('exit', async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
});

module.exports = connectDB;


