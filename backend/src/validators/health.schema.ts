import { z } from 'zod';

import { registry } from '../docs/openapi.js';
import { dataResponse, dateTimeSchema } from './common.schema.js';

// ---- OpenAPI ----

const serviceStatusSchema = z.enum(['up', 'down']);

const healthSchema = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  database: serviceStatusSchema,
  cache: serviceStatusSchema,
  uptime: z.number().int().meta({ description: 'Seconds since the server started' }),
  timestamp: dateTimeSchema,
});

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Check the API, the database and the cache',
  description: 'The API works without the cache, so a cache problem gives `degraded` and 200.',
  responses: {
    200: dataResponse('The API works', healthSchema),
    503: dataResponse('The database is down', healthSchema),
  },
});
