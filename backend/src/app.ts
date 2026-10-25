import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { requestId } from './middlewares/request-id.middleware.js';
import { apiRouter } from './routes/index.js';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      serializers: {
        req: (req: { id: unknown; method: unknown; url: unknown }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: unknown }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(
    helmet({
      // The app runs on plain HTTP, so the browser must not change requests to HTTPS.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
