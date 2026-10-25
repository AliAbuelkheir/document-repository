import { pipeline } from 'node:stream/promises';

import { create as contentDisposition } from 'content-disposition';
import type { RequestHandler } from 'express';

import { currentUser } from '../middlewares/auth.middleware.js';
import { uploadedFile } from '../middlewares/upload.middleware.js';
import * as documentService from '../services/document.service.js';
import { canShowInline, contentTypeHeader } from '../utils/file-types.js';
import { idParamsSchema } from '../validators/common.schema.js';
import {
  contentQuerySchema,
  createDocumentBodySchema,
  createVersionBodySchema,
  listDocumentsQuerySchema,
  permissionsBodySchema,
  updateDocumentBodySchema,
  versionParamsSchema,
} from '../validators/document.schema.js';

export const listDocuments: RequestHandler = async (req, res) => {
  const query = listDocumentsQuerySchema.parse(req.query);
  res.json(await documentService.listDocuments(currentUser(req), query));
};

export const createDocument: RequestHandler = async (req, res) => {
  const file = uploadedFile(req);
  const input = createDocumentBodySchema.parse(req.body);
  const document = await documentService.createDocument(currentUser(req), file, input);
  res.status(201).json({ data: document });
};

export const getDocument: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  res.json({ data: await documentService.getDocument(currentUser(req), id) });
};

export const updateDocument: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateDocumentBodySchema.parse(req.body);
  res.json({ data: await documentService.updateDocument(currentUser(req), id, input) });
};

export const deleteDocument: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  await documentService.deleteDocument(currentUser(req), id);
  res.status(204).end();
};

export const updatePermissions: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const input = permissionsBodySchema.parse(req.body);
  res.json({ data: await documentService.setPermissions(currentUser(req), id, input) });
};

export const listVersions: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  res.json({ data: await documentService.listVersions(currentUser(req), id) });
};

export const createVersion: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const file = uploadedFile(req);
  const { changeNote } = createVersionBodySchema.parse(req.body);
  const version = await documentService.addVersion(currentUser(req), id, file, changeNote);
  res.status(201).json({ data: version });
};

export const getVersionContent: RequestHandler = async (req, res) => {
  const { id, versionId } = versionParamsSchema.parse(req.params);
  const { disposition } = contentQuerySchema.parse(req.query);
  const { version, stream } = await documentService.openVersionContent(
    currentUser(req),
    id,
    versionId,
  );

  let dispositionType = 'attachment';
  if (disposition === 'inline' && canShowInline(version.mimeType)) {
    dispositionType = 'inline';
  }
  res.set({
    'Content-Type': contentTypeHeader(version.mimeType),
    'Content-Length': String(version.sizeBytes),
    'Content-Disposition': contentDisposition(version.originalFilename, { type: dispositionType }),
    'Cache-Control': 'private, no-cache',
    ETag: `"${version.checksumSha256}"`,
  });
  await pipeline(stream, res);
};
