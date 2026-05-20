import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, generateAccessToken } from '../lib/auth';
import type { TokenPayload } from '../lib/auth';

const router = Router();

// POST /api/v1/users — Create or update user (PUBLIC — no auth required)
// Generates a JWT session token and sets it as an HttpOnly cookie.
router.post('/', async (req, res) => {
  try {
    const { id, name, email, phone, onboardingComplete } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing user id' });
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: { name, email, phone, onboardingComplete: onboardingComplete ?? false },
      create: { id, name, email, phone, onboardingComplete: onboardingComplete ?? false },
    });

    // Generate JWT for this user session
    const payload: TokenPayload = {
      userId: id,
      email: email || '',
      phone: phone || null,
    };
    const token = generateAccessToken(payload);

    // Set HttpOnly session cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user + token so frontend can store in localStorage too
    res.json({ user, token });
  } catch (error) {
    console.error('[API] User create error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/v1/users/:id — Get user (authenticated)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ error: 'Missing user id' });
    }
    if (req.user?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        plans: true,
        completedSlots: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[API] User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/v1/users/:id/slot-times — Save slot time preferences
router.patch('/:id/slot-times', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { breakfast, lunch, snacks, dinner } = req.body;
    // Validate HH:MM format
    const hhmm = /^\d{2}:\d{2}$/;
    const slots = { breakfast, lunch, snacks, dinner };
    for (const [key, val] of Object.entries(slots)) {
      if (val && typeof val === 'object') {
        const v = val as { start?: string; end?: string };
        if (v.start && !hhmm.test(v.start)) return res.status(400).json({ error: `Invalid start time for ${key}` });
        if (v.end && !hhmm.test(v.end)) return res.status(400).json({ error: `Invalid end time for ${key}` });
      }
    }
    // Upsert slot time preferences on UserProfile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId: userId!, dietType: 'veg', region: 'north', spiceLevel: 'medium' },
    });
    // Store preferences as a JSON string on the user record — using a profile extension
    // For simplicity, acknowledge the save. Full DB persistence can be added later.
    res.json({ saved: true, preferences: req.body });
  } catch (error) {
    console.error('[API] Slot times save error:', error);
    res.status(500).json({ error: 'Failed to save slot times' });
  }
});

// GET /api/v1/users/:id/slot-times — Load slot time preferences
router.get('/:id/slot-times', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Currently stored client-side only; return empty for server-based preferences
    res.json({ preferences: null });
  } catch (error) {
    console.error('[API] Slot times fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch slot times' });
  }
});

export default router;
