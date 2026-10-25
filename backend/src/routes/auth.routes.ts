import { Router } from 'express';

import { getMe, login, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, getMe);
