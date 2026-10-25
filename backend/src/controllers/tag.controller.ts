import type { RequestHandler } from 'express';

import * as tagService from '../services/tag.service.js';
import { idParamsSchema } from '../validators/common.schema.js';
import {
  createTagBodySchema,
  listTagsQuerySchema,
  updateTagBodySchema,
} from '../validators/tag.schema.js';

export const listTags: RequestHandler = async (req, res) => {
  const query = listTagsQuerySchema.parse(req.query);
  res.json({ data: await tagService.listTags(query) });
};

export const createTag: RequestHandler = async (req, res) => {
  const { name } = createTagBodySchema.parse(req.body);
  res.status(201).json({ data: await tagService.createTag(name) });
};

export const updateTag: RequestHandler = async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const { isActive } = updateTagBodySchema.parse(req.body);
  res.json({ data: await tagService.setTagActive(id, isActive) });
};
