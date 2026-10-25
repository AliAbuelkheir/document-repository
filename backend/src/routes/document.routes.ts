import { Router } from 'express';

import {
  createDocument,
  createVersion,
  deleteDocument,
  getDocument,
  getVersionContent,
  listDocuments,
  listVersions,
  updateDocument,
  updatePermissions,
} from '../controllers/document.controller.js';
import { uploadFile } from '../middlewares/upload.middleware.js';

export const documentRouter = Router();

documentRouter.get('/', listDocuments);
documentRouter.post('/', uploadFile, createDocument);
documentRouter.get('/:id', getDocument);
documentRouter.patch('/:id', updateDocument);
documentRouter.delete('/:id', deleteDocument);
documentRouter.put('/:id/permissions', updatePermissions);
documentRouter.get('/:id/versions', listVersions);
documentRouter.post('/:id/versions', uploadFile, createVersion);
documentRouter.get('/:id/versions/:versionId/content', getVersionContent);
