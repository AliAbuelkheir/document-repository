import type { Metadata } from 'next';
import { Suspense } from 'react';

import { DocumentDetailView } from '@/components/documents/document-detail-view';

export const metadata: Metadata = {
  title: 'Document - Document Repository',
};

export default function DocumentPage() {
  return (
    // The view reads the id and the query string, so it renders in the browser.
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <DocumentDetailView />
    </Suspense>
  );
}
