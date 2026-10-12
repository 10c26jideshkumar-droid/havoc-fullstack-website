import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import creatorRoutes from './routes/creatorRoutes';
import briefRoutes from './routes/briefRoutes';
import pickRoutes from './routes/pickRoutes';
import { errorHandler } from './middlewares/error';
import { seedMockData } from './db/seed';

export const createApp = (): Application => {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: '*', // Configure to Lovable domain or frontend origin in production
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

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

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/creators', creatorRoutes);
  app.use('/api/briefs', briefRoutes);
  app.use('/api', pickRoutes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const startServer = async () => {
  const app = createApp();

  // Pre-seed mock data for immediate developer use
  await seedMockData();

  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🚀 HAVOC API Server running on port ${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/health`);
    console.log(`   API Docs: http://localhost:${config.port}/api`);
    console.log(`=================================================`);
  });
};

if (require.main === module) {
  startServer();
}
