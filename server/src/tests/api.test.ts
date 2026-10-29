import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { verifyPaymentSignature } from '../services/razorpayService.js';

describe('AuraMart API Tests', () => {
  let customerToken = '';
  let adminToken = '';
  let testProductId = '';
  let testAddressId = '';
  let createdOrderId = '';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Authentication Flow', () => {
    it('should login demo customer with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@auramart.com',
          password: 'Customer@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('customer@auramart.com');
      customerToken = res.body.token;
    });

    it('should reject invalid customer credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@auramart.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate email during registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Test',
          email: 'customer@auramart.com',
          phone: '+91 9999999999',
          password: 'Password@123',
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          acceptTerms: true
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.isRegistered).toBe(true);
    });

    it('should login admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@auramart.com',
          password: 'Admin@AuraMart2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.token;
    });

    it('should fetch authenticated profile via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('customer@auramart.com');
      expect(res.body.addresses.length).toBeGreaterThan(0);
      testAddressId = res.body.addresses[0]._id;
    });
  });

  describe('3. Product Catalog & Search', () => {
    it('should fetch categories with product counts', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });

    it('should list products with pagination and filter', async () => {
      const res = await request(app).get('/api/products?page=1&limit=6');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.pagination.total).toBeGreaterThan(0);
      testProductId = res.body.products[0]._id;
    });

    it('should search products by keyword', async () => {
      const res = await request(app).get('/api/products?q=Sony');
      expect(res.status).toBe(200);
      const sony = res.body.products.find((p: any) => p.brand.toLowerCase() === 'sony');
      expect(sony).toBeDefined();
    });

    it('should provide typeahead search suggestions', async () => {
      const res = await request(app).get('/api/products/search/suggestions?q=headphone');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
    });
  });

  describe('4. Shopping Cart & Inventory Checks', () => {
    it('should add product to cart', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 1
        });

      expect(res.status).toBe(200);
      expect(res.body.cart.items.length).toBeGreaterThan(0);
      expect(res.body.cart.grandTotal).toBeGreaterThan(0);
    });

    it('should reject quantity exceeding available stock', async () => {
      const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProductId,
          quantity: 99999
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Checkout & Order Pricing Calculation', () => {
    it('should validate checkout totals on server with coupon discount', async () => {
      const res = await request(app)
        .post('/api/checkout/validate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId: testAddressId,
          couponCode: 'AURA10'
        });

      expect(res.status).toBe(200);
      expect(res.body.pricing.grandTotal).toBeGreaterThan(0);
      expect(res.body.pricing.itemsTotal).toBeGreaterThan(0);
    });

    it('should create an order with COD payment method', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          addressId: testAddressId,
          paymentMethod: 'cod',
          couponCode: 'AURA10'
        });

      expect(res.status).toBe(201);
      expect(res.body.order.orderNumber).toMatch(/^AURA-/);
      expect(res.body.order.paymentMethod).toBe('cod');
      expect(res.body.order.orderStatus).toBe('Confirmed');
      createdOrderId = res.body.order._id;
    });

    it('should fetch user orders and verify order ownership', async () => {
      const res = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order._id).toBe(createdOrderId);
    });
  });

  describe('6. Razorpay Signature Verification & Security', () => {
    it('should reject forged or fake payment signature', () => {
      const isValid = verifyPaymentSignature(
        'order_fake_123456',
        'pay_fake_987654',
        'invalid_forged_signature_hex'
      );
      expect(isValid).toBe(false);
    });
  });

  describe('7. AURA AI Grounded Assistant', () => {
    it('should answer product queries grounded in catalog', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Can you show me headphones under 35000?'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toBeDefined();
    });

    it('should provide return policy details', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'What is your return policy?'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toContain('Return & Cancellation Policy');
    });
  });

  describe('8. Admin Security Guard & Dashboard', () => {
    it('should block non-admin users from admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow verified admin to access dashboard metrics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.totalProducts).toBeGreaterThan(0);
      expect(res.body.stats.totalUsers).toBeGreaterThan(0);
    });
  });
});

