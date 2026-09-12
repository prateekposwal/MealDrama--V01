import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import dotenv from 'dotenv';
import { prisma, connectWithRetry } from './lib/prisma';
import { APIError } from './lib/apiError';
import { mountSpaFallback } from './lib/spaFallback';
import './lib/auth';

// Load environment variables
dotenv.config();

// Initialize Express
const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy — required behind Render/nginx so Express sees the real protocol
// (X-Forwarded-Proto: https) and builds correct OAuth callbackURLs.
app.set('trust proxy', 1);

// Prisma singleton initialized in lib/prisma.ts

// ============================================================================
// MIDDLEWARE
// ============================================================================

// JSON parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Cookie parsing (for session token)
app.use(cookieParser());
app.use(passport.initialize());

// CORS
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};
app.use(cors(corsOptions));

// Explicit OPTIONS preflight — cors() middleware already handles this via corsOptions,
// but we add a catch-all so every route returns 204 + CORS headers for preflight.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ============================================================================
// ERROR HANDLING CLASS
// ============================================================================

// APIError moved to lib/apiError.ts (leaf) so route modules can import it
// without pulling this app into vitest; re-exported for backward compat.
export { APIError } from './lib/apiError';

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', {
    code: err.code || 'UNKNOWN_ERROR',
    message: err.message,
    details: err.details,
    stack: err.stack,
  });

  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString(),
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  });
};

// ============================================================================
// STATIC FILE SERVING — serves the built SPA for OAuth callback landing
// ============================================================================

const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  // If the SPA is built, serve index.html for the root
  // (SPA handles its own routing client-side)
  return res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================================================
// RESPONSE WRAPPER MIDDLEWARE — wraps all API responses in { success, data }
// ============================================================================

app.use('/api/v1', (_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    const obj = body as Record<string, unknown> | null;
    if (obj && typeof obj === 'object' && !('success' in obj) && !('error' in obj)) {
      return originalJson({ success: true, data: obj, metadata: { timestamp: new Date().toISOString() } });
    }
    return originalJson(body);
  };
  next();
});

// API v1 routes
app.use('/api/v1/auth', require('./routes/auth').default);
app.use('/api/v1/auth', require('./routes/oauth').default);
app.use('/api/v1/households', require('./routes/households').default);
app.use('/api/v1/households', require('./routes/expenses').default);
app.use('/api/v1/meals', require('./routes/meals').default);
app.use('/api/v1/plan', require('./routes/plan').default);
app.use('/api/v1/complete', require('./routes/complete').default);
app.use('/api/v1/users', require('./routes/users').default);
app.use('/api/v1/tray', require('./routes/tray').default);
app.use('/api/v1/variants', require('./routes/variants').default);
app.use('/api/v1/custom-dishes', require('./routes/custom-dishes').default);
app.use('/api/v1/loop-config', require('./routes/loopConfig').default);
app.use('/api/v1/tts', require('./routes/tts').default);
app.use('/api/v1/events', require('./routes/events').default);
app.use('/api/v1/households', require('./routes/pantry').default);
app.use('/api/v1/households', require('./routes/householdFeed').default);
app.use('/api/v1/households', require('./routes/sharedPlan').default);
app.use('/api/v1/households', require('./routes/householdKitchen').default);
app.use('/api/v1/diet', require('./routes/diet').default);
app.use('/api/v1/households', require('./routes/diet').householdDietsRouter);
app.use('/api/v1/meal-log', require('./routes/mealLog').default);
app.use('/api/v1/households', require('./routes/householdPlans').default);

// SPA fallback (shared with the asset-MIME regression suite — see
// server/src/lib/spaFallback.ts for the contract). Serves index.html ONLY for
// navigation-like (extensionless, non-/assets/) GETs. Any file-like URL is a
// MISSING ASSET: it falls through to the JSON 404 handler below — answering it
// with index.html (200 + text/html) breaks module loading in the browser
// ('text/html' is not a valid JavaScript MIME type).
mountSpaFallback(app, distPath);

// 404 handler for non-GET requests
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Connect to database (retries through Neon free-tier cold-start)
    await connectWithRetry();
    console.log('✓ Database connected');

    // Start Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ API Base: http://localhost:${PORT}/api/v1`);
      console.log(`✓ Health Check: http://localhost:${PORT}/health`);
      console.log(`✓ Trust proxy: ${app.get('trust proxy')}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\nSIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('✗ Server startup failed:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
