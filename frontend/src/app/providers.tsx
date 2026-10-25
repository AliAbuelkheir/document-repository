'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  // One client for each browser tab. useState keeps the same client on each render.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  );
}
