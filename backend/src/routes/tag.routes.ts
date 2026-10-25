import { Router } from 'express';

import { createTag, listTags, updateTag } from '../controllers/tag.controller.js';
import { requireRole } from '../middlewares/require-role.middleware.js';

export const tagRouter = Router();

tagRouter.get('/', listTags);
tagRouter.post('/', requireRole('ADMIN'), createTag);
tagRouter.patch('/:id', requireRole('ADMIN'), updateTag);
