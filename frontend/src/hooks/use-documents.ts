'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDocument,
  createVersion,
  deleteDocument,
  getDocument,
  listDocuments,
  listVersions,
  setPermissions,
  updateDocument,
} from '@/services/document.service';
import type {
  CreateDocumentInput,
  CreateVersionInput,
  DocumentDetail,
  DocumentListParams,
  PermissionsInput,
  UpdateDocumentInput,
} from '@/types/document';

export const documentKeys = {
  all: ['documents'] as const,
  lists: ['documents', 'list'] as const,
  list: (params: DocumentListParams) => ['documents', 'list', params] as const,
  detail: (id: string) => ['documents', 'detail', id] as const,
  versions: (id: string) => ['documents', 'versions', id] as const,
};

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => listDocuments(params),
    placeholderData: keepPreviousData,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocument(id),
  });
}

export function useDocumentVersions(id: string) {
  return useQuery({
    queryKey: documentKeys.versions(id),
    queryFn: () => listVersions(id),
  });
}

interface UploadVariables<TInput> {
  input: TInput;
  onProgress: (percent: number) => void;
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, onProgress }: UploadVariables<CreateDocumentInput>) =>
      createDocument(input, onProgress),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentKeys.lists });
    },
  });
}

export function useCreateVersion(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, onProgress }: UploadVariables<CreateVersionInput>) =>
      createVersion(documentId, input, onProgress),
    onSuccess: async () => {
      // The detail, the version list and the lists all show the current version.
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/** Puts the document from the response in the cache, and marks the lists as old. */
function useSaveDocumentInCache() {
  const queryClient = useQueryClient();
  return async (document: DocumentDetail) => {
    queryClient.setQueryData(documentKeys.detail(document.id), document);
    await queryClient.invalidateQueries({ queryKey: documentKeys.lists });
  };
}

export function useUpdateDocument(documentId: string) {
  const saveDocumentInCache = useSaveDocumentInCache();
  return useMutation({
    mutationFn: (input: UpdateDocumentInput) => updateDocument(documentId, input),
    onSuccess: saveDocumentInCache,
  });
}

export function useSetPermissions(documentId: string) {
  const saveDocumentInCache = useSaveDocumentInCache();
  return useMutation({
    mutationFn: (input: PermissionsInput) => setPermissions(documentId, input),
    onSuccess: saveDocumentInCache,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => {
      // The detail query is not refreshed: the page of the deleted document closes.
      await queryClient.invalidateQueries({ queryKey: documentKeys.lists });
    },
  });
}
