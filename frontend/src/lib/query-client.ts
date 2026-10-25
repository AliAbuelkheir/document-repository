import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api-client';

const MAX_RETRIES = 2;

/** Retries network errors and server errors only. A 4xx error gives the same result again. */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
    },
  });
}
