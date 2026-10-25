'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { USER_PICKER_PAGE_SIZE } from '@/lib/constants';
import { createUser, getUser, listUsers, updateUser } from '@/services/user.service';
import type { ListResponse } from '@/types/api';
import type { UpdateUserInput, UserListItem, UserListParams } from '@/types/user';

export const userKeys = {
  all: ['users'] as const,
  list: (params: UserListParams) => ['users', 'list', params] as const,
  picker: (search: string, onlyActive: boolean) =>
    ['users', 'picker', { search, onlyActive }] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
  });
}

/** Loads each user of a list of ids, for example to show the names of the selected users. */
export function useUsersByIds(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: userKeys.detail(id),
      queryFn: () => getUser(id),
    })),
  });
}

function nextPageNumber(lastPage: ListResponse<UserListItem>): number | undefined {
  if (lastPage.meta.page < lastPage.meta.totalPages) {
    return lastPage.meta.page + 1;
  }
  return undefined;
}

/** The users for a picker: a server search, 50 users for each page, for an infinite scroll. */
export function useUserPicker(search: string, onlyActive: boolean) {
  return useInfiniteQuery({
    queryKey: userKeys.picker(search, onlyActive),
    queryFn: ({ pageParam }) =>
      listUsers({
        search: search === '' ? undefined : search,
        isActive: onlyActive ? true : undefined,
        page: pageParam,
        pageSize: USER_PICKER_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: nextPageNumber,
  });
}

/** A change to a user also changes owner names, user counts and the current user. */
function useInvalidateUserData() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: ['departments'] }),
      queryClient.invalidateQueries({ queryKey: ['auth'] }),
    ]);
  };
}

export function useCreateUser() {
  const invalidateUserData = useInvalidateUserData();
  return useMutation({
    mutationFn: createUser,
    onSuccess: invalidateUserData,
  });
}

interface UpdateUserVariables {
  id: string;
  input: UpdateUserInput;
}

export function useUpdateUser() {
  const invalidateUserData = useInvalidateUserData();
  return useMutation({
    mutationFn: ({ id, input }: UpdateUserVariables) => updateUser(id, input),
    onSuccess: invalidateUserData,
  });
}
