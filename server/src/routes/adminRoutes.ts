import { Router, Response } from 'express';
import { authenticateJwt, requireAdmin, AuthRequest } from '../middlewares/auth.js';
import { Order, OrderStatus } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { Coupon } from '../models/Coupon.js';
import { AuditLog } from '../models/AuditLog.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import mongoose from 'mongoose';

const router = Router();

// Apply auth + admin guard to all admin routes
router.use(authenticateJwt, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalOrders,
      ordersByStatus,
      paidRevenueResult,
      totalUsers,
      totalProducts,
      lowStockProducts,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: 'paid' },
              { paymentMethod: 'cod', orderStatus: 'Delivered' }
            ]
          }
        },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.grandTotal' } } }
      ]),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Product.find({ stock: { $lte: 10 } }).select('title stock discountedPrice sku images').limit(10),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    const revenue = paidRevenueResult[0]?.totalRevenue || 0;
    const statusMap: Record<string, number> = {};
    ordersByStatus.forEach(item => {
      statusMap[item._id] = item.count;
    });

    res.json({
      success: true,
      stats: {
        totalRevenue: revenue,
        totalOrders,
        totalUsers,
        totalProducts,
        ordersByStatus: statusMap,
        lowStockCount: lowStockProducts.length
      },
      lowStockProducts,
      recentOrders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/products
router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, q, category } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q as string, $options: 'i' } },
        { brand: { $regex: q as string, $options: 'i' } },
        { sku: { $regex: q as string, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      filter.category = category;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 chars'),
    price: z.number().min(0, 'Price must be positive'),
    discountPercent: z.number().min(0).max(95).default(0),
    brand: z.string().min(1, 'Brand is required'),
    categoryId: z.string().min(1, 'Category is required'),
    sku: z.string().min(1, 'SKU is required'),
    stock: z.number().int().min(0),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    features: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.boolean().default(false),
    isTrending: z.boolean().default(false),
    isBestseller: z.boolean().default(false)
  })
});

// POST /api/admin/products
router.post('/products', validate(createProductSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      price,
      discountPercent,
      brand,
      categoryId,
      sku,
      stock,
      images,
      features,
      tags,
      isFeatured,
      isTrending,
      isBestseller
    } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(400).json({ success: false, message: 'Invalid category specified.' });
      return;
    }

    // Slug generation
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const discountedPrice = discountPercent > 0
      ? Math.round(price * (1 - discountPercent / 100))
      : price;

    const product = await Product.create({
      title,
      slug: uniqueSlug,
      description,
      price,
      discountPercent,
      discountedPrice,
      brand,
      category: category._id,
      categoryName: category.name,
      sku: sku.toUpperCase(),
      stock,
      images,
      features: features || [],
      tags: tags || [],
      isFeatured: Boolean(isFeatured),
      isTrending: Boolean(isTrending),
      isBestseller: Boolean(isBestseller)
    });

    await AuditLog.create({
      adminUser: req.user!._id,
      action: 'CREATE_PRODUCT',
      targetType: 'Product',
      targetId: product._id.toString(),
      details: { title: product.title, sku: product.sku }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.price !== undefined || updates.discountPercent !== undefined) {
      const existing = await Product.findById(id);
      if (existing) {
        const price = updates.price !== undefined ? updates.price : existing.price;
        const discountPercent = updates.discountPercent !== undefined ? updates.discountPercent : existing.discountPercent;
        updates.discountedPrice = discountPercent > 0
          ? Math.round(price * (1 - discountPercent / 100))
          : price;
      }
    }

    if (updates.categoryId) {
      const cat = await Category.findById(updates.categoryId);
      if (cat) {
        updates.category = cat._id;
        updates.categoryName = cat.name;
      }
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await AuditLog.create({
      adminUser: req.user!._id,
      action: 'UPDATE_PRODUCT',
      targetType: 'Product',
      targetId: id,
      details: updates
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await AuditLog.create({
      adminUser: req.user!._id,
      action: 'DELETE_PRODUCT',
      targetType: 'Product',
      targetId: id,
      details: { title: product.title }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (search) {
      filter.orderNumber = { $regex: search as string, $options: 'i' };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus, note = '' } = req.body;

    const validStatuses: OrderStatus[] = [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Return Requested',
      'Returned',
      'Refunded'
    ];

    if (!validStatuses.includes(orderStatus)) {
      res.status(400).json({ success: false, message: 'Invalid order status.' });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    order.orderStatus = orderStatus;
    order.statusTimeline.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Order updated to ${orderStatus} by administrator`
    });

    // If COD delivered, mark payment as paid
    if (orderStatus === 'Delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    // If marked cancelled by admin, restore inventory
    if (orderStatus === 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();

    await AuditLog.create({
      adminUser: req.user!._id,
      action: 'UPDATE_ORDER_STATUS',
      targetType: 'Order',
      targetId: id,
      details: { newStatus: orderStatus, note }
    });

    res.json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: 'customer' })
      .select('name email phone createdAt isEmailVerified')
      .sort({ createdAt: -1 });

    const userStats = await Order.aggregate([
      {
        $group: {
          _id: '$user',
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: '$pricing.grandTotal' }
        }
      }
    ]);

    const statsMap = new Map();
    userStats.forEach(s => {
      statsMap.set(s._id.toString(), {
        ordersCount: s.ordersCount,
        totalSpent: s.totalSpent
      });
    });

    const enrichedUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
      ordersCount: statsMap.get(u._id.toString())?.ordersCount || 0,
      totalSpent: statsMap.get(u._id.toString())?.totalSpent || 0
    }));

    res.json({
      success: true,
      users: enrichedUsers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/coupons
router.get('/coupons', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/coupons
router.post('/coupons', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      discountPercent,
      maxDiscountAmount,
      minOrderAmount,
      validUntil,
      usageLimit
    } = req.body;

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountPercent,
      maxDiscountAmount,
      minOrderAmount: minOrderAmount || 0,
      validUntil: new Date(validUntil),
      usageLimit: usageLimit || 1000,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/coupons/:id/toggle
router.patch('/coupons/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`,
      coupon
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

