import type { DataResponse } from '@/types/api';
import type { Tag, TagListParams } from '@/types/tag';

import { apiRequest } from './api-client';

export async function listTags(params: TagListParams): Promise<Tag[]> {
  const response = await apiRequest<DataResponse<Tag[]>>('/tags', { query: { ...params } });
  return response.data;
}

export async function createTag(name: string): Promise<Tag> {
  const response = await apiRequest<DataResponse<Tag>>('/tags', {
    method: 'POST',
    body: { name },
  });
  return response.data;
}

/** Tag names cannot change. An admin can only deactivate (delete) or restore a tag. */
export async function setTagActive(id: string, isActive: boolean): Promise<Tag> {
  const response = await apiRequest<DataResponse<Tag>>(`/tags/${id}`, {
    method: 'PATCH',
    body: { isActive },
  });
  return response.data;
}
