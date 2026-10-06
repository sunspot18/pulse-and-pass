import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';

export const app = express();

// Security and utility middlewares
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:3000'],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '5mb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  if (ENV.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
  }
  next();
});

// Phase 1 Health Check Endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'pulse-and-pass-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  });
});

// Mount Core API Routes
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} does not exist on Pulse & Pass Box Office API`,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);
