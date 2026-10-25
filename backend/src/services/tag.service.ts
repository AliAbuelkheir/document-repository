import { ConflictError, NotFoundError } from '../errors/app-error.js';
import * as tagModel from '../models/tag.model.js';
import type { TagRecord } from '../models/tag.model.js';
import type { Json } from '../types/common.js';
import { cached, hashParams, invalidate } from '../utils/cache.js';
import type { ListTagsQuery } from '../validators/tag.schema.js';

/** The tag pickers send `isActive=true`, so they do not show deactivated tags. */
export async function listTags(query: ListTagsQuery): Promise<Json<TagRecord[]>> {
  return cached({ group: 'tags', name: 'tags', key: hashParams(query) }, () =>
    tagModel.findAll(query),
  );
}

export async function createTag(name: string): Promise<TagRecord> {
  const existing = await tagModel.findByNames([name]);
  if (existing.length > 0) {
    throw new ConflictError('A tag with this name exists', [
      { path: 'name', message: 'A tag with this name exists' },
    ]);
  }
  const tag = await tagModel.create(name);
  await invalidate(['tags']);
  return tag;
}

/**
 * Tag names cannot change. An admin can only activate or deactivate a tag.
 * Deactivate is the delete: documents that have the tag keep it.
 */
export async function setTagActive(id: string, isActive: boolean): Promise<TagRecord> {
  if (!(await tagModel.findById(id))) {
    throw new NotFoundError('Tag not found');
  }
  const tag = await tagModel.setActive(id, isActive);
  await invalidate(['tags']);
  return tag;
}
