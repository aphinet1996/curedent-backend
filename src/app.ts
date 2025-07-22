// import express, { Application, Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import mongoSanitize from 'express-mongo-sanitize';
// import compression from 'compression';
// import { config } from './config/environment';
// import { connectDB } from './config/db';
// import { logger } from './utils/logger';
// import { errorMiddleware } from './middlewares/error.middleware';

// // Import routes
// import routes from './routes';

// class App {
//   public app: Application;

//   constructor() {
//     this.app = express();
//     this.configureMiddlewares();
//     this.configureRoutes();
//     this.configureErrorHandling();
//   }

//   private configureMiddlewares(): void {
//     // Body parser
//     this.app.use(express.json({ limit: '10kb' }));
//     this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//     // Security middlewares
//     this.app.use(helmet()); // Set security HTTP headers

//     // CORS configuration
//     const corsOptions = {
//       origin: config.ALLOWED_ORIGINS.split(','),
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//       allowedHeaders: ['Content-Type', 'Authorization'],
//       credentials: true,
//       maxAge: 86400 // 24 hours
//     };
//     this.app.use(cors(corsOptions));

//     // Data sanitization against NoSQL query injection
//     // this.app.use(mongoSanitize());

//     // Compression
//     this.app.use(compression());

//     // Request logging
//     const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
//     this.app.use(morgan(morganFormat, {
//       stream: {
//         write: (message: string) => logger.http(message.trim())
//       }
//     }));

//     // Rate limiting
//     const limiter = rateLimit({
//       windowMs: 15 * 60 * 1000, // 15 minutes
//       max: 100, // Limit each IP to 100 requests per windowMs
//       standardHeaders: true,
//       legacyHeaders: false,
//       message: 'Too many requests from this IP, please try again later.'
//     });
//     this.app.use('/api', limiter);

//     // Health check endpoint
//     this.app.get('/health', (req: Request, res: Response) => {
//       res.status(200).json({ status: 'UP', timestamp: new Date() });
//     });
//   }

//   private configureRoutes(): void {
//     // Serve static files สำหรับรูปภาพและไฟล์อื่นๆ
//     this.app.use('/uploads', express.static('uploads'));

//     // API routes
//     this.app.use(config.API_PREFIX, routes);

//     // Handle undefined routes
//     this.app.all('/{*any}', (req: Request, res: Response, next: NextFunction) => {
//       res.status(404).json({
//         status: 'error',
//         message: `Cannot find ${req.originalUrl} on this server!`
//       });
//     });
//   }

//   private configureErrorHandling(): void {
//     // Global error handling middleware
//     this.app.use(errorMiddleware);
//   }

//   public async start(): Promise<void> {
//     try {
//       // Connect to MongoDB
//       await connectDB();
//       logger.info('Connected to MongoDB');

//       // Start the server
//       const PORT = config.PORT || 3000;
//       this.app.listen(PORT, () => {
//         logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
//       });
//     } catch (error) {
//       logger.error('Failed to start server:', error);
//       process.exit(1);
//     }
//   }
// }

// // Create app instance
// const appInstance = new App();

// // Handle uncaught exceptions
// process.on('uncaughtException', (err: Error) => {
//   logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
//   process.exit(1);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err: Error) => {
//   logger.error('UNHANDLED REJECTION! Shutting down...', err);
//   process.exit(1);
// });

// // Handle SIGTERM signal
// process.on('SIGTERM', () => {
//   logger.info('SIGTERM received. Shutting down gracefully');
//   process.exit(0);
// });

// // Export the App instance and the Express application
// export { appInstance, App };
// export default appInstance.app;

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
import { proxyHeadersMiddleware, ensureUploadDirectories } from './middlewares/upload.middleware';

// Import routes
import routes from './routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureProxySettings();
    this.ensureDirectories();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureProxySettings(): void {
    // Trust proxy for reverse proxy setup (nginx)
    this.app.set('trust proxy', 1);
  }

  private ensureDirectories(): void {
    // Ensure upload directories exist
    ensureUploadDirectories();
  }

  private configureMiddlewares(): void {
    // Body parser
    this.app.use(express.json({ limit: '10mb' })); // เพิ่มขนาด limit สำหรับ upload
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middlewares - Updated helmet config
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing for uploads
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", "*"], // Allow images from any source
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
        },
      },
    }));

    // CORS configuration - Updated to support proxy headers
    const corsOptions = {
      origin: config.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Forwarded-Proto', 
        'X-Forwarded-Host', 
        'X-Real-IP',
        'X-Forwarded-For'
      ],
      credentials: true,
      maxAge: 86400 // 24 hours
    };
    this.app.use(cors(corsOptions));

    // Data sanitization against NoSQL query injection
    // this.app.use(mongoSanitize());

    // Compression
    this.app.use(compression());

    // Proxy headers middleware (must be before routes)
    this.app.use(proxyHeadersMiddleware);

    // Request logging
    const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message: string) => logger.http(message.trim())
      }
    }));

    // Rate limiting - Updated with separate limits for uploads
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api', apiLimiter);

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'UP', 
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  private configureRoutes(): void {
    // Serve static files สำหรับรูปภาพและไฟล์อื่นๆ - Enhanced configuration
    this.app.use('/uploads', express.static('uploads', {
      maxAge: '1y', // Cache for 1 year
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set additional headers for images
        if (path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('X-Content-Type-Options', 'nosniff');
        }
        // Log static file access in development
        if (config.NODE_ENV === 'development') {
          logger.info(`Static file served: ${path}`);
        }
      }
    }));

    // API routes
    this.app.use(config.API_PREFIX, routes);

    // Handle undefined API routes specifically
    this.app.use('/api/{*any}', (req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Handle undefined routes
    this.app.all('/{*any}', (req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: `Cannot find ${req.originalUrl} on this server!`,
        method: req.method
      });
    });
  }

  private configureErrorHandling(): void {
    // Handle file upload errors specifically
    this.app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
      // Handle multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          status: 'error',
          message: 'ขนาดไฟล์เกินที่กำหนด',
          error: {
            code: 'FILE_TOO_LARGE',
            maxSize: '10MB'
          }
        });
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
          status: 'error',
          message: 'ประเภทไฟล์ไม่ถูกต้อง',
          error: {
            code: 'INVALID_FILE_TYPE'
          }
        });
        return;
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          status: 'error',
          message: 'จำนวนไฟล์เกินที่กำหนด',
          error: {
            code: 'TOO_MANY_FILES'
          }
        });
        return;
      }

      // Pass to global error handler
      next(error);
    });

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
        logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
        logger.info(`📁 Upload directory: uploads/`);
        logger.info(`🔄 Reverse proxy: enabled`);
        logger.info(`🌐 API endpoint: ${config.API_PREFIX}`);
        logger.info(`💾 Static files: /uploads`);
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