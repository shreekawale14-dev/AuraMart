import { Router, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { Wishlist } from '../models/Wishlist.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import mongoose from 'mongoose';

const router = Router();

// GET /api/wishlist
router.get('/', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    let wishlist = await Wishlist.findOne({ user: userId }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    res.json({
      success: true,
      wishlist: wishlist.products
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/wishlist/:productId
router.post('/:productId', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const productId = req.params.productId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    const prodObjId = new mongoose.Types.ObjectId(productId);
    const exists = wishlist.products.some(p => p.toString() === productId);

    if (exists) {
      // Toggle remove
      wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
      await wishlist.save();
      res.json({
        success: true,
        message: 'Removed from wishlist',
        isWishlisted: false,
        wishlist: wishlist.products
      });
      return;
    } else {
      wishlist.products.push(prodObjId as any);
      await wishlist.save();
      res.json({
        success: true,
        message: 'Added to wishlist!',
        isWishlisted: true,
        wishlist: wishlist.products
      });
      return;
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
      await wishlist.save();
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/wishlist/:productId/move-to-cart
router.post('/:productId/move-to-cart', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (product.stock <= 0) {
      res.status(400).json({ success: false, message: 'Product is currently out of stock.' });
      return;
    }

    // Add to cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (existingIndex > -1) {
      if (cart.items[existingIndex].quantity + 1 <= product.stock) {
        cart.items[existingIndex].quantity += 1;
      }
    } else {
      cart.items.push({
        product: product._id as any,
        quantity: 1,
        priceAtAddition: product.discountedPrice
      });
    }
    await cart.save();

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
      await wishlist.save();
    }

    res.json({
      success: true,
      message: `${product.title} moved to cart!`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
