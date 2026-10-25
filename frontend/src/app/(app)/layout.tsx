import { cn } from 'cn';
import type { ReactNode } from 'react';

import { AppSidebar } from '@/components/shared/app-sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AppSidebar />
      {/* On desktop, the work area scrolls and the sidebar stays in place. */}
      <main
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-5 px-4 py-5 md:h-dvh md:overflow-y-auto md:px-8',
          'md:py-7',
        )}>
        {children}
      </main>
    </div>
  );
}
