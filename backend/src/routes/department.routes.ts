import { Router } from 'express';

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../controllers/department.controller.js';
import { requireRole } from '../middlewares/require-role.middleware.js';

export const departmentRouter = Router();

departmentRouter.get('/', listDepartments);
departmentRouter.post('/', requireRole('ADMIN'), createDepartment);
departmentRouter.patch('/:id', requireRole('ADMIN'), updateDepartment);
departmentRouter.delete('/:id', requireRole('ADMIN'), deleteDepartment);
