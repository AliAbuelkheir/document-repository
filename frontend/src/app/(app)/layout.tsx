import type { ReactNode } from 'react';

import { AppHeader } from '@/components/shared/app-header';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-6">{children}</main>
    </>
  );
}
