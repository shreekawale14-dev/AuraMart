import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Address } from '../models/Address.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { ENV } from '../config/env.js';
import { authenticateJwt, AuthRequest } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    street: z.string().min(3, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(4, 'Postal/PIN code is required'),
    country: z.string().default('India'),
    addressType: z.enum(['Home', 'Work', 'Other']).default('Home'),
    isDefaultAddress: z.boolean().default(true),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and privacy policy'
    })
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

// Cookie helper
const setAuthCookie = (res: Response, token: string) => {
  const isProduction = ENV.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password,
      street,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefaultAddress
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
        isRegistered: true
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: 'customer' // Clients can never elevate themselves to admin!
    });

    // Create the initial address
    const initialAddress = await Address.create({
      user: user._id,
      fullName: name.trim(),
      phone: phone.trim(),
      street: street.trim(),
      addressLine2: addressLine2?.trim() || '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country || 'India',
      addressType: addressType || 'Home',
      isDefault: isDefaultAddress !== false
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to AuraMart.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      defaultAddress: initialAddress
    });
  } catch (error: any) {
    console.error('[Register Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please try again.'
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookie(res, token);

    // Fetch default address
    const defaultAddress = await Address.findOne({ user: user._id, isDefault: true }) ||
      await Address.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      defaultAddress
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticateJwt, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const addresses = await Address.find({ user: user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      addresses
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Do not disclose whether email exists
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.'
      });
      return;
    }

    // Generate random secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Invalidate existing tokens
    await PasswordResetToken.deleteMany({ user: user._id });

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${rawToken}`;
    console.log(`[Password Reset Dev Log] Generated reset link for ${user.email}: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been generated.',
      // In development mode when SMTP is not configured, supply honest token info for testing
      ...(ENV.NODE_ENV !== 'production' ? { devResetUrl: resetUrl, devToken: rawToken } : {})
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token. Please request a new one.'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(resetRecord.user, { passwordHash });
    resetRecord.used = true;
    await resetRecord.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

