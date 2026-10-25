'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTag, listTags, setTagActive } from '@/services/tag.service';
import type { TagListParams } from '@/types/tag';

export const tagKeys = {
  all: ['tags'] as const,
  list: (params: TagListParams) => ['tags', params] as const,
};

/** Use `{ isActive: true }` for the tag pickers. The filters and Settings show all tags. */
export function useTags(params: TagListParams = {}) {
  return useQuery({
    queryKey: tagKeys.list(params),
    queryFn: () => listTags(params),
  });
}

function useInvalidateTags() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: tagKeys.all });
  };
}

export function useCreateTag() {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: createTag,
    onSuccess: invalidateTags,
  });
}

interface SetTagActiveVariables {
  id: string;
  isActive: boolean;
}

export function useSetTagActive() {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: ({ id, isActive }: SetTagActiveVariables) => setTagActive(id, isActive),
    onSuccess: invalidateTags,
  });
}
