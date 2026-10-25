import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import { getOpenApiDocument } from '../docs/openapi.js';
// The health route has no input, so no controller imports this file. It registers the path.
import '../validators/health.schema.js';

export const docsRouter = Router();
docsRouter.use(swaggerUi.serve);
docsRouter.get('/', (req, res, next) => {
  swaggerUi.setup(getOpenApiDocument(), {
    customSiteTitle: 'Document Repository API',
    swaggerOptions: { withCredentials: true },
  })(req, res, next);
});
