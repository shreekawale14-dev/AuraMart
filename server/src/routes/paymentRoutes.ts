import { Router, Request, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  isRazorpayConfigured
} from '../services/razorpayService.js';
import { ENV } from '../config/env.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';

const router = Router();

// GET /api/payments/config
router.get('/config', (req: Request, res: Response): void => {
  res.json({
    success: true,
    isConfigured: isRazorpayConfigured(),
    keyId: isRazorpayConfigured() ? ENV.RAZORPAY_KEY_ID : null
  });
});

const createOrderSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required')
  })
});

// POST /api/payments/razorpay/create-order
router.post('/razorpay/create-order', authenticateJwt, validate(createOrderSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(400).json({ success: false, message: 'This order has already been paid.' });
      return;
    }

    if (!isRazorpayConfigured()) {
      res.status(400).json({
        success: false,
        message: 'Razorpay keys are not configured. To test online payments, add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env. You can also complete your purchase using Cash on Delivery!'
      });
      return;
    }

    const rzOrder = await createRazorpayOrder(
      order.pricing.grandTotal,
      order.orderNumber,
      { orderId: order._id.toString(), userId: userId.toString() }
    );

    order.paymentDetails = {
      ...order.paymentDetails,
      razorpayOrderId: rzOrder.id
    };
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: ENV.RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay signature is required')
  })
});

// POST /api/payments/razorpay/verify
router.post('/razorpay/verify', authenticateJwt, validate(verifyPaymentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Verify cryptographic signature
    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      // Record failed payment attempt
      await Payment.create({
        order: order._id,
        user: userId,
        amount: order.pricing.grandTotal,
        currency: 'INR',
        provider: 'razorpay',
        status: 'failed',
        transactionId: razorpayPaymentId,
        razorpayOrderId,
        signature: razorpaySignature,
        rawResponse: { error: 'Invalid HMAC signature' }
      });

      res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature. Order has NOT been marked as paid.'
      });
      return;
    }

    // Mark order as paid
    order.paymentStatus = 'paid';
    order.orderStatus = 'Confirmed';
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paidAt: new Date()
    };
    order.statusTimeline.push({
      status: 'Confirmed',
      timestamp: new Date(),
      note: `Online payment verified successfully (Payment ID: ${razorpayPaymentId})`
    });

    await order.save();

    // Create payment ledger entry
    await Payment.create({
      order: order._id,
      user: userId,
      amount: order.pricing.grandTotal,
      currency: 'INR',
      provider: 'razorpay',
      status: 'captured',
      transactionId: razorpayPaymentId,
      razorpayOrderId,
      signature: razorpaySignature
    });

    res.json({
      success: true,
      message: 'Payment verified successfully! Your order is confirmed.',
      order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payments/razorpay/webhook
router.post('/razorpay/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = ENV.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      res.status(400).json({ success: false, message: 'Missing signature or webhook secret.' });
      return;
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const rzOrderId = paymentEntity.order_id;

      const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': rzOrderId });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'Confirmed';
        order.paymentDetails = {
          ...order.paymentDetails,
          razorpayPaymentId: paymentEntity.id,
          paidAt: new Date()
        };
        order.statusTimeline.push({
          status: 'Confirmed',
          timestamp: new Date(),
          note: `Webhook verified: payment captured (${paymentEntity.id})`
        });
        await order.save();
      }
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

