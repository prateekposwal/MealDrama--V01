/**
 * OAuth Authentication Routes — Google Sign-In for MealDrama.
 *
 * Setup required:
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create OAuth 2.0 Client ID (Web application)
 *   3. Add redirect URI: https://mealdrama.onrender.com/api/v1/auth/google/callback
 *   4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env (or Render env)
 *
 * Flow:
 *   - Web:  GET /auth/google → Google → callback → redirect to FRONTEND_URL/auth/callback?token=TOKEN
 *   - APK:  GET /auth/google?app=1 → Google → callback → redirect to mealdrama://auth/callback?token=TOKEN
 */

import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';
import { generateAccessToken } from '../lib/auth';

const router = Router();

// Base URL of the server itself — used to build the absolute callbackURL.
// Behind Render's proxy, trust proxy = 1 makes req.protocol === 'https' and
// req.hostname === 'mealdrama.onrender.com', so this is only a fallback.
const SERVER_BASE = process.env.SERVER_BASE_URL || '';

// Initialize Google OAuth strategy
// callbackURL is ABSOLUTE so passport/Express doesn't guess the protocol.
// trust proxy (index.ts) ensures req.protocol is https behind Render.
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  // Build callbackURL dynamically per-request when possible; static fallback
  // uses SERVER_BASE_URL or falls back to relative (works with trust proxy).
  callbackURL: SERVER_BASE
    ? `${SERVER_BASE}/api/v1/auth/google/callback`
    : '/api/v1/auth/google/callback',
  // When trust proxy is enabled, Passport/Express builds the absolute URL
  // from req.protocol + req.hostname, producing https://mealdrama.onrender.com/...
  passReqToCallback: false,
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
// Accepts ?app=1 query param to indicate this is from the APK.
// The param is forwarded as the OAuth state parameter so the callback
// can decide whether to redirect to a deep link or the web frontend.
router.get('/google', ((req: Request, res: Response, next: any) => {
  const isApp = req.query.app === '1';
  const authenticator = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    // Pass app indicator through the OAuth state parameter
    state: isApp ? 'app' : 'web',
  } as any);
  authenticator(req, res, next);
}) as any);

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

    // Determine redirect target based on the OAuth state parameter
    const state = req.query.state as string | undefined;

    if (state === 'app') {
      // APK: redirect to custom URL scheme deep link.
      // Android intent filter for mealdrama:// opens the app.
      res.redirect(`mealdrama://auth/callback?token=${encodeURIComponent(token)}`);
    } else {
      // Web: redirect to the SPA at FRONTEND_URL so the token can be
      // read from the URL by the App.tsx OAuth useEffect.
      const frontendUrl = process.env.FRONTEND_URL || 'https://mealdrama.onrender.com';
      res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
    }
  },
);

export default router;
