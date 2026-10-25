import type { DocumentDetail } from '@/types/document';

import { PrincipalList } from './principal-list';

interface AccessSummaryProps {
  document: DocumentDetail;
}

/** The visibility, viewers and editors of a document, read-only. */
export function AccessSummary({ document }: AccessSummaryProps) {
  const isPublic = document.visibility === 'PUBLIC';

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        <span className="font-medium">Visibility: </span>
        {isPublic ? 'Public (all users can read)' : 'Restricted'}
      </p>
      {!isPublic && (
        <div className="flex flex-col gap-1">
          <span className="font-medium">Viewers</span>
          <PrincipalList principals={document.viewers} emptyMessage="No viewers." />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="font-medium">Editors</span>
        <PrincipalList principals={document.editors} emptyMessage="No editors." />
      </div>
    </div>
  );
}
