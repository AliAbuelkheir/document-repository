import { Router } from 'express';

import { authenticate } from '../middlewares/auth.middleware.js';
import { authRouter } from './auth.routes.js';
import { departmentRouter } from './department.routes.js';
import { docsRouter } from './docs.routes.js';
import { documentRouter } from './document.routes.js';
import { healthRouter } from './health.routes.js';
import { tagRouter } from './tag.routes.js';
import { userRouter } from './user.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/docs', docsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/documents', authenticate, documentRouter);
apiRouter.use('/users', authenticate, userRouter);
apiRouter.use('/departments', authenticate, departmentRouter);
apiRouter.use('/tags', authenticate, tagRouter);
