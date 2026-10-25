import type { RequestHandler } from 'express';

import * as departmentService from '../services/department.service.js';
import { idParamsSchema } from '../validators/common.schema.js';
import {
  createDepartmentBodySchema,
  updateDepartmentBodySchema,
} from '../validators/department.schema.js';

export const listDepartments: RequestHandler = async (_req, res) => {
  res.json({ data: await departmentService.listDepartments() });
};

export const createDepartment: RequestHandler = async (req, res) => {
  const input = createDepartmentBodySchema.parse(req.body);
  res.status(201).json({ data: await departmentService.createDepartment(input) });
};

export const updateDepartment: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateDepartmentBodySchema.parse(req.body);
  res.json({ data: await departmentService.updateDepartment(id, input) });
};

export const deleteDepartment: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  await departmentService.deleteDepartment(id);
  res.status(204).end();
};
