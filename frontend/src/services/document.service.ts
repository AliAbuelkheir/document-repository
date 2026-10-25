import type { DataResponse, ListResponse } from '@/types/api';
import type {
  ContentDisposition,
  CreateDocumentInput,
  CreateVersionInput,
  DocumentDetail,
  DocumentListItem,
  DocumentListParams,
  DocumentVersion,
  PermissionsInput,
  UpdateDocumentInput,
} from '@/types/document';

import { apiRequest, apiRequestNoContent, apiUpload } from './api-client';

export function listDocuments(params: DocumentListParams): Promise<ListResponse<DocumentListItem>> {
  return apiRequest<ListResponse<DocumentListItem>>('/documents', { query: { ...params } });
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const response = await apiRequest<DataResponse<DocumentDetail>>(`/documents/${id}`);
  return response.data;
}

export async function createDocument(
  input: CreateDocumentInput,
  onProgress: (percent: number) => void,
): Promise<DocumentDetail> {
  const formData = new FormData();
  // The text fields go first, so the API can check them before the file arrives.
  formData.append('title', input.title);
  formData.append('description', input.description);
  for (const tag of input.tags) {
    formData.append('tags', tag);
  }
  formData.append('permissions', JSON.stringify(input.permissions));
  formData.append('file', input.file);

  const response = await apiUpload<DataResponse<DocumentDetail>>(
    '/documents',
    formData,
    onProgress,
  );
  return response.data;
}

export async function updateDocument(
  id: string,
  input: UpdateDocumentInput,
): Promise<DocumentDetail> {
  const response = await apiRequest<DataResponse<DocumentDetail>>(`/documents/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return response.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiRequestNoContent(`/documents/${id}`, { method: 'DELETE' });
}

export async function setPermissions(id: string, input: PermissionsInput): Promise<DocumentDetail> {
  const response = await apiRequest<DataResponse<DocumentDetail>>(`/documents/${id}/permissions`, {
    method: 'PUT',
    body: input,
  });
  return response.data;
}

export async function listVersions(id: string): Promise<DocumentVersion[]> {
  const response = await apiRequest<DataResponse<DocumentVersion[]>>(`/documents/${id}/versions`);
  return response.data;
}

export async function createVersion(
  id: string,
  input: CreateVersionInput,
  onProgress: (percent: number) => void,
): Promise<DocumentVersion> {
  const formData = new FormData();
  formData.append('changeNote', input.changeNote);
  formData.append('file', input.file);

  const response = await apiUpload<DataResponse<DocumentVersion>>(
    `/documents/${id}/versions`,
    formData,
    onProgress,
  );
  return response.data;
}

/** The URL of the file of a version. The browser sends the session cookie with it. */
export function versionContentUrl(
  documentId: string,
  versionId: string,
  disposition: ContentDisposition,
): string {
  return `/api/documents/${documentId}/versions/${versionId}/content?disposition=${disposition}`;
}
