/**
 * OAuth Authentication Routes — Google Sign-In for MealDrama.
 *
 * Setup required:
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create OAuth 2.0 Client ID (Web application)
 *   3. Add redirect URI: http://localhost:3001/api/v1/auth/google/callback
 *   4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
 */

import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';
import { generateAccessToken } from '../lib/auth';

const router = Router();

// Initialize Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: '/api/v1/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || null;
    const name = profile.displayName || profile.name?.givenName || 'Google User';
    const googleId = profile.id;

    // Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (user) {
      // Update googleId if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          systemId: `google_${googleId}`,
        },
      });
      await prisma.userProfile.create({
        data: { userId: user.id },
      });
    }

    done(null, { userId: user.id, email: user.email || '', phone: null, name: user.name || undefined });
  } catch (err) {
    done(err as Error);
  }
}));

// Serialize/deserialize for session
passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((obj: any, done) => done(null, obj));

// ─── Initiate Google OAuth ──
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// ─── Google OAuth callback ──
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/?auth=error' }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateAccessToken({
      userId: user.userId,
      email: user.email,
      phone: null,
      name: user.name,
    });
    // Redirect back to Vite frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  },
);

export default router;
