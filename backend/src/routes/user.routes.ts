import { Router } from 'express';

import { createUser, getUser, listUsers, updateUser } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/require-role.middleware.js';

export const userRouter = Router();

userRouter.get('/', listUsers);
userRouter.post('/', requireRole('ADMIN'), createUser);
userRouter.get('/:id', getUser);
userRouter.patch('/:id', requireRole('ADMIN'), updateUser);
