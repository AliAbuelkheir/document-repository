import type { RequestHandler } from 'express';

import { currentUser } from '../middlewares/auth.middleware.js';
import * as userService from '../services/user.service.js';
import { idParamsSchema } from '../validators/common.schema.js';
import {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
} from '../validators/user.schema.js';

export const listUsers: RequestHandler = async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  res.json(await userService.listUsers(query));
};

export const getUser: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  res.json({ data: await userService.getUser(id) });
};

export const createUser: RequestHandler = async (req, res) => {
  const input = createUserBodySchema.parse(req.body);
  res.status(201).json({ data: await userService.createUser(input) });
};

export const updateUser: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateUserBodySchema.parse(req.body);
  res.json({ data: await userService.updateUser(currentUser(req), id, input) });
};
