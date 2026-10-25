import { cn } from 'cn';
import { GlobeIcon, LockIcon } from 'lucide-react';

import type { DocumentDetail } from '@/types/document';

import { PrincipalList } from './principal-list';

interface AccessSummaryProps {
  document: DocumentDetail;
}

function VisibilityRow({ isPublic }: { isPublic: boolean }) {
  const Icon = isPublic ? GlobeIcon : LockIcon;
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full bg-selected text-primary',
        )}>
        <Icon className="size-4" />
      </span>
      <span className="flex flex-col">
        <span className="font-medium">{isPublic ? 'Public' : 'Restricted'}</span>
        <span className="text-muted-foreground">
          {isPublic ? 'All users can read.' : 'The owner, admins, viewers and editors can read.'}
        </span>
      </span>
    </div>
  );
}

/** The visibility, viewers and editors of a document, read-only. */
export function AccessSummary({ document }: AccessSummaryProps) {
  const isPublic = document.visibility === 'PUBLIC';

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <VisibilityRow isPublic={isPublic} />
      {!isPublic && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Viewers</span>
          <PrincipalList principals={document.viewers} emptyMessage="No viewers." />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Editors</span>
        <PrincipalList principals={document.editors} emptyMessage="No editors." />
      </div>
    </div>
  );
}
