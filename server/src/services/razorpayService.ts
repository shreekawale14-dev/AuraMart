import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

let razorpayInstance: Razorpay | null = null;

export const isRazorpayConfigured = (): boolean => {
  return Boolean(
    ENV.RAZORPAY_KEY_ID &&
    ENV.RAZORPAY_KEY_SECRET &&
    !ENV.RAZORPAY_KEY_ID.includes('dummy') &&
    !ENV.RAZORPAY_KEY_ID.includes('your_')
  );
};

export const getRazorpayInstance = (): Razorpay | null => {
  if (!isRazorpayConfigured()) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET
    });
  }

  return razorpayInstance;
};

export const createRazorpayOrder = async (
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>
) => {
  const instance = getRazorpayInstance();
  if (!instance) {
    throw new Error(
      'Razorpay credentials are not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env'
    );
  }

  const options = {
    amount: Math.round(amountInRupees * 100), // amount in the smallest currency unit (paise)
    currency: 'INR',
    receipt,
    notes: notes || {}
  };

  return await instance.orders.create(options);
};

export const verifyPaymentSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  if (!ENV.RAZORPAY_KEY_SECRET) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, 'utf-8'),
    Buffer.from(razorpaySignature, 'utf-8')
  );
};

export const verifyWebhookSignature = (
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
};

