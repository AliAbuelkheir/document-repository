'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export type SearchParamUpdates = Record<string, string | string[] | undefined>;

/**
 * Returns a function that changes some query parameters of the current URL and keeps the others.
 * A list repeats the key (`?tags=a&tags=b`).
 * Undefined, an empty string or an empty list removes the parameter.
 */
export function useUpdateSearchParams(): (updates: SearchParamUpdates) => void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (updates: SearchParamUpdates) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        nextParams.delete(key);
        if (Array.isArray(value)) {
          for (const item of value) {
            nextParams.append(key, item);
          }
        } else if (value !== undefined && value !== '') {
          nextParams.set(key, value);
        }
      }

      const query = nextParams.toString();
      const url = query === '' ? pathname : `${pathname}?${query}`;
      router.replace(url, { scroll: false });
    },
    [router, pathname, searchParams],
  );
}
