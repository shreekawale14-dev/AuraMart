import { Router, Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

const router = Router();

// GET /api/categories
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Aggregate product counts per category
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = new Map<string, number>();
    counts.forEach(c => {
      if (c._id) countMap.set(c._id.toString(), c.count);
    });

    const enriched = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      productCount: countMap.get(cat._id.toString()) || 0
    }));

    res.json({ success: true, categories: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

