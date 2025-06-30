import mongoose from 'mongoose';
import { config, isDevelopment } from './environment';
import { logger } from '../utils/logger';

// Define options for MongoDB connection
const mongooseOptions: mongoose.ConnectOptions = {
  // These options help with connection stability and error handling
  serverSelectionTimeoutMS: 5000, // Keep trying to connect for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

/**
 * Connect to MongoDB
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    // Clear existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create new connection
    const connection = await mongoose.connect(config.MONGODB_URI, mongooseOptions);
    
    // Log connection status
    if (isDevelopment) {
      logger.info(`MongoDB Connected: ${connection.connection.host}`);
    }

    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return connection;
  } catch (error: any) {
    logger.error(`MongoDB connection error: ${error.message}`);
    // Rethrow the error to be handled by the caller
    throw error;
  }
};

/**
 * Close MongoDB connection
 */
export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error: any) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

// Export mongoose for direct use
export default mongoose;