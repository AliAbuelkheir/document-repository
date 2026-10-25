import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SettingsView } from '@/components/settings/settings-view';

export const metadata: Metadata = {
  title: 'Settings - Document Repository',
};

export default function SettingsPage() {
  return (
    // The view reads the query string, so it renders in the browser.
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <SettingsView />
    </Suspense>
  );
}
