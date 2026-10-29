import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error:`, error);
    // In production or development without local MongoDB running, provide clear guidance
    console.warn(`[MongoDB Warning] Ensure MongoDB is running locally on mongodb://127.0.0.1:27017 or set MONGODB_URI to MongoDB Atlas.`);
  }
};

