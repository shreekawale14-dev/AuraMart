import { Router, Request, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import mongoose from 'mongoose';

const router = Router();

const reviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().min(2, 'Review headline is required').max(100),
    comment: z.string().min(5, 'Review comment must be at least 5 characters').max(1000)
  })
});

// GET /api/products/:productId/reviews
router.get('/:productId/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

    const total = reviews.length;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach(r => {
      const rating = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
      distribution[rating] = (distribution[rating] || 0) + 1;
      sum += r.rating;
    });

    const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;

    res.json({
      success: true,
      reviews,
      summary: {
        total,
        average,
        distribution
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products/:productId/reviews
router.post('/:productId/reviews', authenticateJwt, validate(reviewSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const userName = req.user!.name;
    const productId = req.params.productId as string;
    const { rating, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Check if user already reviewed
    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      res.status(409).json({ success: false, message: 'You have already submitted a review for this product.' });
      return;
    }

    // Check verified purchase
    const orderWithProduct = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: { $in: ['Delivered', 'Confirmed', 'Processing', 'Shipped'] }
    });

    const review = await Review.create({
      product: productId,
      user: userId,
      userName,
      rating,
      title,
      comment,
      verifiedPurchase: Boolean(orderWithProduct)
    });

    // Recalculate product ratingsAvg and ratingsCount
    const allReviews = await Review.find({ product: productId });
    const count = allReviews.length;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / count).toFixed(1));

    product.ratingsAvg = avg;
    product.ratingsCount = count;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      review
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
