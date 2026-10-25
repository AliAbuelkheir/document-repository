import { Router } from 'express';

import { prisma } from '../config/prisma.js';
import { isCacheAvailable } from '../utils/cache.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const [isDatabaseUp, isCacheUp] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    isCacheAvailable(),
  ]);

  let status = 'ok';
  if (!isDatabaseUp) {
    status = 'down';
  } else if (!isCacheUp) {
    status = 'degraded';
  }

  res.status(isDatabaseUp ? 200 : 503).json({
    data: {
      status,
      database: isDatabaseUp ? 'up' : 'down',
      cache: isCacheUp ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});
