import { Router, Response } from 'express';
import { optionalAuth, AuthRequest } from '../middlewares/auth.js';
import { processAuraChat } from '../services/aiService.js';
import { ChatConversation } from '../models/ChatConversation.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for AI chat: 30 requests per minute
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many queries. Please slow down.' }
});

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(500, 'Message cannot exceed 500 characters'),
    sessionId: z.string().optional()
  })
});

// POST /api/ai/chat
router.post('/chat', chatLimiter, optionalAuth, validate(chatSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, sessionId = 'default-session' } = req.body;
    const userId = req.user?._id?.toString();

    const result = await processAuraChat(message, userId);

    // Save to conversation history asynchronously
    try {
      await ChatConversation.findOneAndUpdate(
        { sessionId, ...(userId ? { user: req.user!._id } : {}) },
        {
          $push: {
            messages: [
              { sender: 'user', text: message, timestamp: new Date() },
              {
                sender: 'aura',
                text: result.reply,
                products: result.products?.map(p => p._id as any) || [],
                timestamp: new Date()
              }
            ]
          }
        },
        { upsert: true, new: true }
      );
    } catch (saveErr) {
      // Non-blocking log failure
      console.warn('[Chat History Save Error]:', saveErr);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

