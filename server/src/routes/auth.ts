import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { APIError } from '../lib/apiError';
import { prisma } from '../lib/prisma';
import { generateAccessToken, verifyToken, revokeToken, authMiddleware } from '../lib/auth';

const router = Router();

// A guest account is DEVICE-BOUND: `id` is the account key a device created,
// `deviceSecret` is the proof that the caller still owns that key. The secret
// is stored as a bcrypt hash, so leaking the DB never leaks usable secrets.
// No email/phone/systemId lookup EVER issues a token, so "log in as the
// person whose email you know" is impossible. (Guest accounts still carry
// email/phone as OPTIONAL contact fields — they are never a credential.
// Google accounts authenticate exclusively through the /auth/google flow.)
const MIN_SECRET_LENGTH = 16;
function validSecret(s: unknown): s is string {
  return typeof s === 'string' && s.length >= MIN_SECRET_LENGTH;
}
function hashSecret(s: string): string {
  return bcrypt.hashSync(s, 10);
}
function secretMatches(s: string, storedHash: string): boolean {
  try {
    return bcrypt.compareSync(s, storedHash);
  } catch {
    return false;
  }
}

/**
 * POST /auth/register { id, name?, email?, phone?, deviceSecret }
 *
 *  · id NOT found  → create a NEW account (server keeps the client's id for
 *    guests: the id is the device key). Email/phone that already belong to
 *    ANOTHER account → 409 (you cannot claim someone else's identity).
 *  · id found      → SELF-HEAL: issue a token ONLY when the caller proves
 *    possession (deviceSecret matches the stored hash). Never issues a token
 *    for an account found by email/phone/systemId.
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, name, email, phone, deviceSecret } = req.body;

    if (!id || typeof id !== 'string') {
      throw new APIError('VALIDATION_ERROR', 'Missing required field: id', 400);
    }
    if (!validSecret(deviceSecret)) {
      throw new APIError('VALIDATION_ERROR', 'deviceSecret is required (16+ chars) to bind a guest account', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });

    if (existing) {
      if (!existing.deviceSecret) {
        throw new APIError('DEVICE_NOT_VERIFIED', 'This account is not device-bound — sign in with Google or register a fresh account', 401);
      }
      if (!secretMatches(deviceSecret, existing.deviceSecret)) {
        throw new APIError('DEVICE_NOT_VERIFIED', 'Device not verified for this account', 401);
      }
      if (name && name !== existing.name) {
        await prisma.user.update({ where: { id }, data: { name } });
        existing.name = name;
      }
      const token = generateAccessToken({ userId: existing.id, email: existing.email || '', phone: existing.phone, name: existing.name || undefined });
      return res.json({ success: true, data: { user: existing, token } });
    }

    // NEW account: no identity-property collisions allowed.
    if (email || phone) {
      const collision = await prisma.user.findFirst({
        where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
      });
      if (collision) {
        throw new APIError('IDENTITY_CONFLICT', 'Email or phone is already linked to another account', 409);
      }
    }

    const user = await prisma.user.create({
      data: { id, name: name || null, email: email || null, phone: phone || null, deviceSecret: hashSecret(deviceSecret) },
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

/**
 * POST /auth/login { email?, phone?, deviceSecret }
 * Session continuation for a KNOWN account: the caller must prove possession
 * of the account's device secret. (No proof → 401. The old behavior — issue
 * a token for any existing email/phone — was the account-takeover.)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, deviceSecret } = req.body;

    if (!email && !phone) {
      throw new APIError('VALIDATION_ERROR', 'Email or phone required', 400);
    }
    if (!validSecret(deviceSecret)) {
      throw new APIError('VALIDATION_ERROR', 'deviceSecret required (16+ chars)', 400);
    }

    const user = await prisma.user.findFirst({
      where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
      include: { profile: true },
    });

    if (!user) {
      // Prefer the same 401 envelope for unknown vs unverified accounts —
      // never leak which field exists (and the answer is identical either way).
      throw new APIError('DEVICE_NOT_VERIFIED', 'Device not verified for this account', 401);
    }
    if (!user.deviceSecret || !secretMatches(deviceSecret, user.deviceSecret)) {
      throw new APIError('DEVICE_NOT_VERIFIED', 'Device not verified for this account', 401);
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
