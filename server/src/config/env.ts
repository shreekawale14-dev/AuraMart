import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auramart',
  JWT_SECRET: process.env.JWT_SECRET || 'auramart-ultra-secure-jwt-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'auramart-cookie-secret-key-2026',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // AURA AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Admin Initial Seed
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@auramart.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@AuraMart2026'
};

