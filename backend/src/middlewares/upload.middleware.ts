import { randomUUID } from 'node:crypto';

import type { Request, RequestHandler } from 'express';
import multer from 'multer';

import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../errors/app-error.js';
import type { UploadedFile } from '../types/document.js';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  isAllowedExtension,
} from '../utils/file-types.js';
import { TMP_DIR, createTmpDir, removeFile } from '../utils/storage.js';

const MAX_REQUEST_SIZE_BYTES = MAX_FILE_SIZE_BYTES + 1024 * 1024;
const MULTIPART_ERROR_MESSAGES = new Set([
  'Multipart: Boundary not found',
  'Malformed part header',
  'Unexpected end of form',
  'Unexpected end of file',
]);

const storage = multer.diskStorage({
  destination: TMP_DIR,
  filename: (_req, _file, callback) => {
    callback(null, randomUUID());
  },
});

const multerUpload = multer({
  storage,
  defParamCharset: 'utf8',
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 20,
    fieldSize: 100 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedExtension(file.originalname)) {
      const allowed = ALLOWED_EXTENSIONS.join(', ');
      callback(new UnsupportedMediaTypeError(`This file type is not allowed. Use: ${allowed}`));
      return;
    }
    callback(null, true);
  },
}).single('file');

export const uploadFile: RequestHandler = async (req, res, next) => {
  if (Number(req.get('content-length')) > MAX_REQUEST_SIZE_BYTES) {
    res.set('Connection', 'close');
    throw new PayloadTooLargeError('The file is too large. The maximum size is 25 MB.');
  }
  await createTmpDir();

  res.on('close', () => {
    // After a multer error, `req.file` can be a placeholder without a path.
    // Multer deletes its own partial files in that case.
    if (req.file?.path) {
      void removeFile(req.file.path).catch((err: unknown) => {
        req.log.error({ err }, 'Cannot delete the temporary upload');
      });
    }
  });
  multerUpload(req, res, (err?: unknown) => {
    if (err instanceof Error && MULTIPART_ERROR_MESSAGES.has(err.message)) {
      next(new ValidationError('The multipart form is not valid'));
      return;
    }
    next(err);
  });
};

export function uploadedFile(req: Request): UploadedFile {
  if (!req.file) {
    throw new ValidationError('Validation failed', [{ path: 'file', message: 'Select a file' }]);
  }
  return {
    path: req.file.path,
    originalName: req.file.originalname,
    sizeBytes: req.file.size,
  };
}
