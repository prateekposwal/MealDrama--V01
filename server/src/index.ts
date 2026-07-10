import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import './lib/auth';

// Load environment variables
dotenv.config();

// Initialize Express
const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Prisma singleton initialized in lib/prisma.ts

// ============================================================================
// MIDDLEWARE
// ============================================================================

// JSON parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Cookie parsing (for session token)
app.use(cookieParser());

// CORS
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
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

export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

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
  res.json({
    name: 'MealDrama API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      households: '/api/v1/households',
      members: '/api/v1/members',
      'health-profiles': '/api/v1/health-profiles',
    },
  });
});

// API v1 routes
app.use('/api/v1/auth', require('./routes/auth').default);
app.use('/api/v1/households', require('./routes/households').default);
app.use('/api/v1/members', require('./routes/members').default);
app.use('/api/v1/health-profiles', require('./routes/healthProfiles').default);
app.use('/api/v1/meals', require('./routes/meals').default);
app.use('/api/v1/plan', require('./routes/plan').default);
app.use('/api/v1/complete', require('./routes/complete').default);
app.use('/api/v1/users', require('./routes/users').default);
app.use('/api/v1/tray', require('./routes/tray').default);
app.use('/api/v1/variants', require('./routes/variants').default);
app.use('/api/v1/custom-dishes', require('./routes/custom-dishes').default);
app.use('/api/v1/loop-config', require('./routes/loopConfig').default);
app.use('/api/v1/tts', require('./routes/tts').default);

// 404 handler
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
    // Connect to database
    await prisma.$connect();
    console.log('✓ Database connected');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${NODE_ENV}`);
      console.log(`✓ API Base: http://localhost:${PORT}/api/v1`);
      console.log(`✓ Health Check: http://localhost:${PORT}/health`);
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

