import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'mealdrama-dev-secret-not-for-production');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

const REVOKED_TOKENS = new Set<string>();

export interface TokenPayload {
  userId: string;
  email: string;
  phone: string | null;
  name?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  if (REVOKED_TOKENS.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
};

export const revokeToken = (token: string): void => {
  REVOKED_TOKENS.add(token);
  if (REVOKED_TOKENS.size > 10000) {
    const first = REVOKED_TOKENS.values().next().value;
    if (first) REVOKED_TOKENS.delete(first);
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check Authorization header first, then cookie fallback
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.headers.cookie) {
    // Parse cookie manually or via cookie-parser
    const cookies = req.cookies as Record<string, string> | undefined;
    token = cookies?.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = decoded;
  next();
};

export { JWT_SECRET, JWT_EXPIRY };
