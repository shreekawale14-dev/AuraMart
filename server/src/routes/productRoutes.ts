import { Router, Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import mongoose from 'mongoose';

const router = Router();

// GET /api/products/search/suggestions
router.get('/search/suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      res.json({ success: true, suggestions: [] });
      return;
    }

    const products = await Product.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { categoryName: { $regex: q, $options: 'i' } }
      ]
    })
      .select('title slug categoryName discountedPrice images')
      .limit(6);

    const suggestions = products.map(p => ({
      id: p._id,
      title: p.title,
      slug: p.slug,
      categoryName: p.categoryName,
      price: p.discountedPrice,
      image: p.images[0] || ''
    }));

    res.json({ success: true, suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/featured
router.get('/featured', async (req: Request, res: Response): Promise<void> => {
  try {
    const trending = await Product.find({ isTrending: true, stock: { $gt: 0 } }).limit(8);
    const bestsellers = await Product.find({ isBestseller: true, stock: { $gt: 0 } }).limit(8);
    const deals = await Product.find({ discountPercent: { $gte: 20 }, stock: { $gt: 0 } })
      .sort({ discountPercent: -1 })
      .limit(8);
    const topRated = await Product.find({ ratingsAvg: { $gte: 4.5 }, stock: { $gt: 0 } })
      .sort({ ratingsCount: -1 })
      .limit(8);

    res.json({
      success: true,
      data: {
        trending,
        bestsellers,
        deals,
        topRated
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products (Main listing with rich filters)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort = 'newest',
      q
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // Search query
    if (q && (q as string).trim()) {
      const searchTerm = (q as string).trim();
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
        { categoryName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Category filter (slug, id, or name)
    if (category && category !== 'all') {
      const catVal = (category as string).trim();
      if (mongoose.Types.ObjectId.isValid(catVal)) {
        filter.category = new mongoose.Types.ObjectId(catVal);
      } else {
        const catDoc = await Category.findOne({
          $or: [{ slug: catVal }, { name: { $regex: `^${catVal}$`, $options: 'i' } }]
        });
        if (catDoc) {
          filter.category = catDoc._id;
        } else {
          filter.categoryName = { $regex: catVal, $options: 'i' };
        }
      }
    }

    // Brand filter
    if (brand && brand !== 'all') {
      const brands = (brand as string).split(',').map(b => b.trim());
      filter.brand = { $in: brands.map(b => new RegExp(`^${b}$`, 'i')) };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.discountedPrice = {};
      if (minPrice) filter.discountedPrice.$gte = Number(minPrice);
      if (maxPrice) filter.discountedPrice.$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.ratingsAvg = { $gte: Number(minRating) };
    }

    // In Stock filter
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Sorting
    let sortQuery: any = { createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortQuery = { discountedPrice: 1 };
        break;
      case 'price-desc':
        sortQuery = { discountedPrice: -1 };
        break;
      case 'rating-desc':
        sortQuery = { ratingsAvg: -1, ratingsCount: -1 };
        break;
      case 'popular':
        sortQuery = { ratingsCount: -1, isBestseller: -1 };
        break;
      case 'discount-desc':
        sortQuery = { discountPercent: -1 };
        break;
      case 'newest':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter)
    ]);

    // Available brands and price range for facet filters
    const [allBrands, priceStats] = await Promise.all([
      Product.distinct('brand', category && category !== 'all' ? { categoryName: filter.categoryName || { $exists: true } } : {}),
      Product.aggregate([
        { $match: category && category !== 'all' ? (filter.category ? { category: filter.category } : {}) : {} },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$discountedPrice' },
            maxPrice: { $max: '$discountedPrice' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      },
      facets: {
        brands: allBrands.sort(),
        minPrice: priceStats[0]?.minPrice || 0,
        maxPrice: priceStats[0]?.maxPrice || 100000
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:idOrSlug
router.get('/:idOrSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    let product;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      product = await Product.findById(idOrSlug).populate('category', 'name slug');
    }

    if (!product) {
      product = await Product.findOne({ slug: idOrSlug }).populate('category', 'name slug');
    }

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Fetch related products in the same category
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    })
      .limit(6);

    res.json({
      success: true,
      product,
      related
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
