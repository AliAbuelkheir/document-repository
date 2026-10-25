import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DocumentListView } from '@/components/documents/document-list-view';

export const metadata: Metadata = {
  title: 'Documents - EEMW Documents',
};

export default function DocumentsPage() {
  return (
    // The view reads the query string, so it renders in the browser.
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <DocumentListView />
    </Suspense>
  );
}
