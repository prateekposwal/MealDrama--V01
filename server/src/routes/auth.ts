import { Router, Request, Response, NextFunction } from 'express';
import { APIError } from '../index';
import { prisma } from '../lib/prisma';
import { generateAccessToken, verifyToken, revokeToken, authMiddleware } from '../lib/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, name, email, phone, systemId } = req.body;

    if (!id) {
      throw new APIError('VALIDATION_ERROR', 'Missing required field: id', 400);
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
          ...(systemId ? [{ systemId }] : []),
        ],
      },
    });

    if (existing) {
      const token = generateAccessToken({ userId: existing.id, email: existing.email || '', phone: existing.phone, name: existing.name || undefined });
      return res.json({ success: true, data: { user: existing, token } });
    }

    const user = await prisma.user.create({
      data: { id, name: name || null, email: email || null, phone: phone || null, systemId: systemId || null },
    });

    await prisma.userProfile.create({
      data: { userId: user.id },
    });

    const token = generateAccessToken({ userId: user.id, email: user.email || '', phone: user.phone, name: user.name || undefined });

    res.status(201).json({
      success: true,
      data: { user, token },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, systemId } = req.body;

    if (!email && !phone && !systemId) {
      throw new APIError('VALIDATION_ERROR', 'Email, phone, or systemId required', 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
          ...(systemId ? [{ systemId }] : []),
        ],
      },
      include: { profile: true },
    });

    if (!user) {
      throw new APIError('USER_NOT_FOUND', 'User not found. Please register first.', 404);
    }

    const token = generateAccessToken({ userId: user.id, email: user.email || '', phone: user.phone, name: user.name || undefined });

    res.json({
      success: true,
      data: { user, token },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) throw new APIError('VALIDATION_ERROR', 'Token required', 400);

    const payload = verifyToken(token);
    if (!payload) throw new APIError('INVALID_TOKEN', 'Invalid or expired token', 401);

    const newToken = generateAccessToken(payload);
    res.json({ success: true, data: { token: newToken }, metadata: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      include: { profile: true },
    });

    if (!user) throw new APIError('USER_NOT_FOUND', 'User not found', 404);

    res.json({ success: true, data: { user }, metadata: { timestamp: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7);
  if (token) revokeToken(token);
  res.json({ success: true, data: { message: 'Logged out' }, metadata: { timestamp: new Date().toISOString() } });
});

export default router;
