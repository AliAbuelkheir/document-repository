'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { getCurrentUser, login, logout } from '@/services/auth.service';

export const currentUserKey = ['auth', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

/** False while the current user loads, so admin controls do not show too early. */
export function useIsAdmin(): boolean {
  const { data: user } = useCurrentUser();
  return user?.role === 'ADMIN';
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      // Remove the data of a previous session before the new user sees the app.
      queryClient.clear();
      queryClient.setQueryData(currentUserKey, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace('/login');
    },
  });
}
