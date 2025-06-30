import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { config } from './config/environment';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { errorMiddleware } from './middlewares/error.middleware';

// Import routes
import routes from './routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddlewares(): void {
    // Body parser
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // Security middlewares
    this.app.use(helmet()); // Set security HTTP headers

    // CORS configuration
    const corsOptions = {
      origin: config.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400 // 24 hours
    };
    this.app.use(cors(corsOptions));

    // Data sanitization against NoSQL query injection
    // this.app.use(mongoSanitize());

    // Compression
    this.app.use(compression());

    // Request logging
    const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message: string) => logger.http(message.trim())
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api', limiter);

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'UP', timestamp: new Date() });
    });
  }

  private configureRoutes(): void {
    // Serve static files สำหรับรูปภาพและไฟล์อื่นๆ
    this.app.use('/uploads', express.static('uploads'));

    // API routes
    this.app.use(config.API_PREFIX, routes);

    // Handle undefined routes
    this.app.all('/{*any}', (req: Request, res: Response, next: NextFunction) => {
      res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server!`
      });
    });
  }

  private configureErrorHandling(): void {
    // Global error handling middleware
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    try {
      // Connect to MongoDB
      await connectDB();
      logger.info('Connected to MongoDB');

      // Start the server
      const PORT = config.PORT || 3000;
      this.app.listen(PORT, () => {
        logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create app instance
const appInstance = new App();

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  process.exit(0);
});

// Export the App instance and the Express application
export { appInstance, App };
export default appInstance.app;