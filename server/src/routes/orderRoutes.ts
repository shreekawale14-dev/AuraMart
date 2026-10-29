import { Router, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { Order, OrderStatus } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Address } from '../models/Address.js';
import { Coupon } from '../models/Coupon.js';
import { createRazorpayOrder, isRazorpayConfigured } from '../services/razorpayService.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import mongoose from 'mongoose';

const router = Router();

const validateCheckoutSchema = z.object({
  body: z.object({
    addressId: z.string().min(1, 'Address is required'),
    couponCode: z.string().optional()
  })
});

const placeOrderSchema = z.object({
  body: z.object({
    addressId: z.string().min(1, 'Delivery address is required'),
    paymentMethod: z.enum(['razorpay', 'cod']),
    couponCode: z.string().optional()
  })
});

// Helper for server-side order calculation
const calculateOrderPricing = async (
  userId: mongoose.Types.ObjectId,
  couponCode?: string
) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  let itemsTotal = 0;
  const itemsSnapshot = [];

  for (const item of cart.items) {
    const product = item.product as any;
    if (!product || !product._id) {
      throw new Error('One or more items in your cart are no longer available.');
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.title}". Only ${product.stock} available.`);
    }

    const price = product.discountedPrice;
    const itemSubtotal = price * item.quantity;
    itemsTotal += itemSubtotal;

    itemsSnapshot.push({
      product: product._id,
      title: product.title,
      image: product.images[0] || '',
      price: product.discountedPrice,
      originalPrice: product.price,
      quantity: item.quantity,
      variant: item.variant || {},
      subtotal: itemSubtotal
    });
  }

  // Calculate discount from coupon
  let discount = 0;
  let appliedCoupon: any = null;

  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({
      code: cleanCode,
      isActive: true,
      validUntil: { $gt: new Date() }
    });

    if (coupon) {
      if (itemsTotal >= coupon.minOrderAmount) {
        const rawDiscount = (itemsTotal * coupon.discountPercent) / 100;
        discount = Math.min(rawDiscount, coupon.maxDiscountAmount);
        appliedCoupon = {
          code: coupon.code,
          discountAmount: Math.round(discount)
        };
      }
    }
  }

  const freeShippingThreshold = 499;
  const deliveryCharge = itemsTotal >= freeShippingThreshold ? 0 : 40;
  const grandTotal = Math.max(0, Math.round(itemsTotal - discount + deliveryCharge));

  return {
    itemsSnapshot,
    itemsTotal,
    discount,
    deliveryCharge,
    grandTotal,
    appliedCoupon
  };
};

// POST /api/checkout/validate
router.post('/validate', authenticateJwt, validate(validateCheckoutSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { addressId, couponCode } = req.body;

    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      res.status(404).json({ success: false, message: 'Selected address was not found or does not belong to you.' });
      return;
    }

    const calculation = await calculateOrderPricing(userId, couponCode);

    res.json({
      success: true,
      pricing: {
        itemsTotal: calculation.itemsTotal,
        discount: calculation.discount,
        deliveryCharge: calculation.deliveryCharge,
        grandTotal: calculation.grandTotal
      },
      couponApplied: calculation.appliedCoupon,
      itemsCount: calculation.itemsSnapshot.reduce((acc, i) => acc + i.quantity, 0),
      estimatedDeliveryDays: 3
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders (Create order)
router.post('/', authenticateJwt, validate(placeOrderSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { addressId, paymentMethod, couponCode } = req.body;

    // 1. Fetch address
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      res.status(404).json({ success: false, message: 'Delivery address not found.' });
      return;
    }

    // 2. Calculate verified pricing and prepare snapshots
    const calculation = await calculateOrderPricing(userId, couponCode);

    // 3. Address Snapshot (Immutable)
    const addressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      addressType: address.addressType
    };

    // 4. Generate unique order number
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `AURA-${new Date().getFullYear()}-${randomHex}`;

    // 5. Estimated Delivery Date (3 days out)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3);

    // 6. Deduct inventory atomically
    for (const item of calculation.itemsSnapshot) {
      const updateResult = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (!updateResult) {
        throw new Error(`Item ${item.title} went out of stock during checkout. Please try again.`);
      }
    }

    // 7. Initial status & timeline
    const initialStatus: OrderStatus = paymentMethod === 'cod' ? 'Confirmed' : 'Pending';
    const statusTimeline = [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: paymentMethod === 'cod' ? 'Order placed with Cash on Delivery' : 'Order initiated, awaiting online payment'
      }
    ];

    // 8. Create Order Document
    const order = await Order.create({
      orderNumber,
      user: userId,
      items: calculation.itemsSnapshot,
      deliveryAddressSnapshot: addressSnapshot,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: initialStatus,
      statusTimeline,
      pricing: {
        itemsTotal: calculation.itemsTotal,
        discount: calculation.discount,
        deliveryCharge: calculation.deliveryCharge,
        grandTotal: calculation.grandTotal
      },
      couponApplied: calculation.appliedCoupon,
      estimatedDeliveryDate
    });

    // 9. If coupon was used, increment usage count
    if (calculation.appliedCoupon?.code) {
      await Coupon.updateOne(
        { code: calculation.appliedCoupon.code },
        { $inc: { usedCount: 1 } }
      );
    }

    // 10. Clear user's cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    // 11. Handle Razorpay order creation if paymentMethod === 'razorpay'
    let razorpayOrderData = null;
    let isTestMode = false;

    if (paymentMethod === 'razorpay') {
      if (isRazorpayConfigured()) {
        try {
          const rzOrder = await createRazorpayOrder(
            order.pricing.grandTotal,
            order.orderNumber,
            { orderId: order._id.toString(), userId: userId.toString() }
          );

          order.paymentDetails = {
            razorpayOrderId: rzOrder.id
          };
          await order.save();

          razorpayOrderData = {
            id: rzOrder.id,
            amount: rzOrder.amount,
            currency: rzOrder.currency
          };
        } catch (rzError: any) {
          console.error('[Razorpay Order Creation Failed]:', rzError);
          res.status(502).json({
            success: false,
            message: 'Payment gateway connection error. Please choose Cash on Delivery or configure valid Razorpay credentials.',
            orderId: order._id
          });
          return;
        }
      } else {
        // Razorpay keys not configured in server/.env
        isTestMode = true;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        grandTotal: order.pricing.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        estimatedDeliveryDate: order.estimatedDeliveryDate
      },
      razorpayOrder: razorpayOrderData,
      isTestModeNote: isTestMode ? 'Razorpay keys are not yet configured on this server. Razorpay test mode requires RAZORPAY_KEY_ID in server/.env' : undefined
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/orders (My Orders)
router.get('/', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const userRole = req.user!.role;
    const { id } = req.params;

    let query: any = { _id: id };
    if (userRole !== 'admin') {
      // Strictly enforce order ownership for regular customers
      query.user = userId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found or unauthorized.' });
      return;
    }

    res.json({
      success: true,
      order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const cancellableStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      res.status(400).json({
        success: false,
        message: `Orders in "${order.orderStatus}" status cannot be cancelled online.`
      });
      return;
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.orderStatus = 'Cancelled';
    order.cancellationReason = reason;
    order.statusTimeline.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: `Cancelled: ${reason}`
    });

    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
      order.statusTimeline.push({
        status: 'Refunded',
        timestamp: new Date(),
        note: 'Refund initiated for online payment'
      });
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully. Stock has been restored.',
      order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/return-request
router.post('/:id/return-request', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const { reason = 'Return requested by customer' } = req.body;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (order.orderStatus !== 'Delivered') {
      res.status(400).json({
        success: false,
        message: 'Returns can only be requested for delivered orders.'
      });
      return;
    }

    order.orderStatus = 'Return Requested';
    order.statusTimeline.push({
      status: 'Return Requested',
      timestamp: new Date(),
      note: `Customer requested return: ${reason}`
    });
    await order.save();

    res.json({
      success: true,
      message: 'Return request submitted. Our support team will review it within 24 hours.',
      order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

