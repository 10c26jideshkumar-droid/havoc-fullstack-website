import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import creatorRoutes from './routes/creatorRoutes';
import briefRoutes from './routes/briefRoutes';
import pickRoutes from './routes/pickRoutes';
import chatRoutes from './routes/chatRoutes';
import { errorHandler } from './middlewares/error';
import { seedDatabase } from './db/seed';

export const createApp = (): Application => {
  const app = express();

  // Security Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate Limiting for API routes only
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // Logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Health Check
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'HAVOC Creator Marketplace API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Base API Welcome & Docs Info
  app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'HAVOC AI Creator Marketplace API',
      version: '1.0.0',
      prototype_url: 'https://vision-to-creator-connect.lovable.app',
      endpoints: {
        auth: ['POST /api/auth/signup', 'POST /api/auth/signin', 'GET /api/auth/me'],
        creators: ['GET /api/creators', 'GET /api/creators/:id', 'PUT /api/creators/profile', 'POST /api/creators/portfolio'],
        briefs: ['POST /api/briefs', 'GET /api/briefs', 'GET /api/briefs/:id', 'POST /api/briefs/:id/match'],
        picks: ['POST /api/picks', 'GET /api/picks', 'POST /api/invites'],
      },
    });
  });

  // Mount API Routers (with body parsing strictly scoped to API routes)
  const apiRouter = express.Router();
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true }));

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/creators', creatorRoutes);
  apiRouter.use('/briefs', briefRoutes);
  apiRouter.use('/chat', chatRoutes);
  apiRouter.use('/', pickRoutes);

  app.use('/api', apiRouter);

  // Fallback 404 handler for unmatched API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Proxy all frontend pages and assets dynamically from Lovable
  app.use(
    '/',
    createProxyMiddleware({
      target: 'https://vision-to-creator-connect.lovable.app',
      changeOrigin: true,
      ws: true,
      on: {
        proxyReq: (proxyReq) => {
          proxyReq.setHeader('host', 'vision-to-creator-connect.lovable.app');
        },
      },
    })
  );

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const startServer = async () => {
  const app = createApp();

  // Initialize & seed SQLite database
  await seedDatabase();

  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🚀 HAVOC Server running on port ${config.port}`);
    console.log(`   Frontend & App: http://localhost:${config.port}/`);
    console.log(`   Health: http://localhost:${config.port}/health`);
    console.log(`   API Docs: http://localhost:${config.port}/api`);
    console.log(`=================================================`);
  });
};

if (require.main === module) {
  startServer();
}
