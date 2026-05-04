import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';

const router = Router();
router.use(authMiddleware);

// POST /api/v1/users - Create or update user (authenticated)
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, email, phone, onboardingComplete } = req.body;
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { name, email, phone, onboardingComplete: onboardingComplete ?? false },
      create: { id: userId, name, email, phone, onboardingComplete: onboardingComplete ?? false },
    });
    res.json(user);
  } catch (error) {
    console.error('[API] User create error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/v1/users/:id - Get user (authenticated)
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ error: 'Missing user id' });
    }
    // Enforce: users can only fetch their own record unless they are an admin
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

export default router;
