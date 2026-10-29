import { Router, Response } from 'express';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { Address } from '../models/Address.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import mongoose from 'mongoose';

const router = Router();

const addressSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    street: z.string().min(3, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(4, 'Valid PIN/Postal code is required'),
    country: z.string().default('India'),
    addressType: z.enum(['Home', 'Work', 'Other']).default('Home'),
    isDefault: z.boolean().default(false)
  })
});

// GET /api/addresses
router.get('/', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/addresses
router.post('/', authenticateJwt, validate(addressSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      fullName,
      phone,
      street,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault
    } = req.body;

    const existingCount = await Address.countDocuments({ user: userId });
    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const address = await Address.create({
      user: userId,
      fullName,
      phone,
      street,
      addressLine2: addressLine2 || '',
      city,
      state,
      postalCode,
      country: country || 'India',
      addressType: addressType || 'Home',
      isDefault: shouldBeDefault
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/addresses/:id
router.patch('/:id', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid address ID' });
      return;
    }

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found or does not belong to you.' });
      return;
    }

    const updates = req.body;
    if (updates.isDefault === true) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    Object.assign(address, updates);
    await address.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      address
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid address ID' });
      return;
    }

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found or does not belong to you.' });
      return;
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If default was deleted, assign default to another address if available
    if (wasDefault) {
      const remaining = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.json({
      success: true,
      message: 'Address removed successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/addresses/:id/default
router.patch('/:id/default', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const id = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid address ID' });
      return;
    }

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found or does not belong to you.' });
      return;
    }

    await Address.updateMany({ user: userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      address
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
