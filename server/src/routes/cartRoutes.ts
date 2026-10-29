import { Router, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import mongoose from 'mongoose';

const router = Router();

// Helper to calculate cart totals
export const calculateCartTotals = (items: any[]) => {
  let itemsTotal = 0;
  let itemsOriginalTotal = 0;
  let totalItemsCount = 0;

  const validItems = items.filter(item => item.product && item.product._id);

  for (const item of validItems) {
    const price = item.product.discountedPrice ?? item.priceAtAddition;
    const originalPrice = item.product.price ?? price;
    itemsTotal += price * item.quantity;
    itemsOriginalTotal += originalPrice * item.quantity;
    totalItemsCount += item.quantity;
  }

  // Free shipping policy: Orders >= 499 get free shipping, otherwise 40 INR
  const freeShippingThreshold = 499;
  const deliveryCharge = itemsTotal >= freeShippingThreshold || itemsTotal === 0 ? 0 : 40;
  const amountNeededForFreeShipping = itemsTotal < freeShippingThreshold ? Math.max(0, freeShippingThreshold - itemsTotal) : 0;
  const totalSavings = Math.max(0, itemsOriginalTotal - itemsTotal);
  const grandTotal = itemsTotal + deliveryCharge;

  return {
    itemsTotal,
    itemsOriginalTotal,
    totalSavings,
    deliveryCharge,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    grandTotal,
    totalItemsCount
  };
};

// GET /api/cart
router.get('/', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const totals = calculateCartTotals(cart.items);

    res.json({
      success: true,
      cart: {
        _id: cart._id,
        items: cart.items,
        ...totals
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const addItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1).default(1),
    variant: z.record(z.string()).optional()
  })
});

// POST /api/cart/items
router.post('/items', authenticateJwt, validate(addItemSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { productId, quantity, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (product.stock <= 0) {
      res.status(400).json({ success: false, message: 'This product is currently out of stock.' });
      return;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Check if product with same variant exists in cart
    const existingIndex = cart.items.findIndex(item => {
      const isSameProduct = item.product.toString() === productId;
      if (!isSameProduct) return false;
      if (!variant && (!item.variant || Object.keys(item.variant).length === 0)) return true;
      if (!variant || !item.variant) return false;
      return JSON.stringify(item.variant) === JSON.stringify(variant);
    });

    if (existingIndex > -1) {
      const newQuantity = cart.items[existingIndex].quantity + quantity;
      if (newQuantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of ${product.title} are available in stock.`
        });
        return;
      }
      cart.items[existingIndex].quantity = newQuantity;
      cart.items[existingIndex].priceAtAddition = product.discountedPrice;
    } else {
      if (quantity > product.stock) {
        res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of ${product.title} are available in stock.`
        });
        return;
      }
      cart.items.push({
        product: product._id as any,
        variant: variant || {},
        quantity,
        priceAtAddition: product.discountedPrice
      });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product');
    const totals = calculateCartTotals(updatedCart!.items);

    res.json({
      success: true,
      message: `${product.title} added to cart!`,
      cart: {
        _id: updatedCart!._id,
        items: updatedCart!.items,
        ...totals
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/cart/items/:itemId
router.patch('/items/:itemId', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found.' });
      return;
    }

    const item = cart.items.find(i => i._id?.toString() === itemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Cart item not found.' });
      return;
    }

    const product = await Product.findById(item.product);
    if (!product) {
      cart.items = cart.items.filter(i => i._id?.toString() !== itemId);
      await cart.save();
      res.status(400).json({ success: false, message: 'Product is no longer available and was removed from cart.' });
      return;
    }

    if (quantity > product.stock) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stock} units are currently available.`
      });
      return;
    }

    item.quantity = quantity;
    item.priceAtAddition = product.discountedPrice;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate('items.product');
    const totals = calculateCartTotals(updatedCart!.items);

    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: {
        _id: updatedCart!._id,
        items: updatedCart!.items,
        ...totals
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cart/items/:itemId
router.delete('/items/:itemId', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found.' });
      return;
    }

    cart.items = cart.items.filter(i => i._id?.toString() !== itemId);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate('items.product');
    const totals = calculateCartTotals(updatedCart!.items);

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        _id: updatedCart!._id,
        items: updatedCart!.items,
        ...totals
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/cart (Clear)
router.delete('/', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        itemsTotal: 0,
        itemsOriginalTotal: 0,
        totalSavings: 0,
        deliveryCharge: 0,
        grandTotal: 0,
        totalItemsCount: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

