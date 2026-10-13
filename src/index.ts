import express, { Application, NextFunction, Request, Response } from 'express';
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
import { initializeDatabase } from './db/seed';

import brandRoutes from './routes/brandRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import path from 'path';
import fs from 'fs';

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
        brands: ['GET /api/brands', 'GET /api/brands/:id', 'POST /api/brands'],
        portfolios: ['GET /api/portfolios', 'GET /api/portfolios/:id'],
        briefs: ['POST /api/briefs', 'GET /api/briefs', 'GET /api/briefs/:id', 'POST /api/briefs/:id/match', 'POST /api/briefs/recommend'],
        picks: ['POST /api/picks', 'GET /api/picks', 'POST /api/invites'],
        chat: ['POST /api/chat'],
      },
    });
  });

  // Mount API Routers (with body parsing strictly scoped to API routes)
  const apiRouter = express.Router();
  apiRouter.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await initializeDatabase();
      next();
    } catch (error) {
      next(error);
    }
  });
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true }));

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/creators', creatorRoutes);
  apiRouter.use('/brands', brandRoutes);
  apiRouter.use('/portfolios', portfolioRoutes);
  apiRouter.use('/briefs', briefRoutes);
  apiRouter.use('/chat', chatRoutes);
  apiRouter.use('/', pickRoutes);

  app.use('/api', apiRouter);

  // File Upload Endpoint (local disk storage with size and type validation)
  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  apiRouter.post('/upload', (req: Request, res: Response) => {
    try {
      const { filename, content, mimeType } = req.body;
      if (!filename || !content) {
        res.status(400).json({ success: false, error: 'Filename and base64 content are required' });
        return;
      }

      // Check max size (50MB limit)
      const base64Data = content.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 50 * 1024 * 1024) {
        res.status(400).json({ success: false, error: 'File size exceeds maximum 50MB limit' });
        return;
      }

      // Sanitize extension
      const ext = path.extname(filename).toLowerCase();
      const safeExtensions = [
        '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
        '.mp4', '.webm', '.mov', '.mp3', '.wav', '.m4a', '.ogg',
        '.pdf', '.docx', '.pptx', '.xlsx', '.csv', '.txt',
        '.json', '.zip', '.html', '.htm'
      ];
      if (!safeExtensions.includes(ext)) {
        res.status(400).json({ success: false, error: `File type ${ext} is not permitted` });
        return;
      }

      const { v4: uuidv4 } = require('uuid');
      const safeName = `${Date.now()}-${uuidv4()}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeName}`;
      res.status(200).json({
        success: true,
        url: publicUrl,
        filename: safeName,
        originalName: filename,
        size: buffer.length,
        mimeType: mimeType || 'application/octet-stream'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'File upload failed' });
    }
  });

  // Fallback 404 handler for unmatched API routes
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // First check local static public directory (e.g. customized assets, audio, scripts)
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));

  // Serve Home page locally
  app.get('/', (req: Request, res: Response, next) => {
    const filePath = path.join(publicDir, 'index.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Serve Explore Creators directory locally
  app.get('/creators', (req: Request, res: Response, next) => {
    const filePath = path.join(publicDir, 'creators.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Serve Brand space directory locally
  app.get('/brand', (req: Request, res: Response, next) => {
    const filePath = path.join(publicDir, 'brand.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Serve Creator Studio locally
  app.get('/studio', (req: Request, res: Response, next) => {
    const filePath = path.join(publicDir, 'studio.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Serve Sign In locally
  app.get('/sign-in', (req: Request, res: Response, next) => {
    const filePath = path.join(publicDir, 'sign-in.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Serve Get Started locally
  app.get('/get-started', (req: Request, res: Response, next) => {
    const filePath = path.join(publicDir, 'get-started.html');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Serve individual creator profile HTML pages locally
  app.get('/creators/:slug', (req: Request, res: Response, next) => {
    const slug = req.params.slug;
    const filePath = path.join(publicDir, `creator-${slug}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
      return;
    }
    next();
  });

  // Proxy remaining frontend pages and assets dynamically from Lovable
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

const app = createApp();
export default app;

export const startServer = async () => {
  // Initialize & seed SQLite database
  await initializeDatabase();

  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🚀 HAVOC Server running on port ${config.port}`);
    console.log(`   Frontend & App: http://localhost:${config.port}/`);
    console.log(`   Health: http://localhost:${config.port}/health`);
    console.log(`   API Docs: http://localhost:${config.port}/api`);
    console.log(`=================================================`);
  });

  if (Number(config.port) !== 58427) {
    app.listen(58427, '0.0.0.0', () => {
      console.log(`🚀 HAVOC Mirror Server also running on http://127.0.0.1:58427/`);
    }).on('error', () => {});
  }
};

if (require.main === module) {
  startServer();
}
