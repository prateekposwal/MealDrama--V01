import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

const REVOKED_TOKENS = new Set<string>();

export interface TokenPayload {
  userId: string;
  email: string;
  phone: string | null;
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
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = decoded;
  next();
};

export { JWT_SECRET, JWT_EXPIRY };
