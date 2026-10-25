'use client';

import { cn } from 'cn';
import { UserIcon, UsersIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Principal } from '@/types/document';

interface PrincipalListProps {
  principals: Principal[];
  /** Without `onRemove`, the list is read-only. */
  onRemove?: (principal: Principal) => void;
  emptyMessage: string;
}

export function principalLabel(principal: Principal): string {
  if (principal.type === 'DEPARTMENT') {
    return `${principal.name} (department)`;
  }
  return principal.name;
}

/** The viewers or the editors of a document. */
export function PrincipalList({ principals, onRemove, emptyMessage }: PrincipalListProps) {
  if (principals.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5 text-[13px]">
      {principals.map((principal) => (
        <li key={`${principal.type}:${principal.id}`} className="flex min-h-7 items-center gap-2">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full bg-muted',
              'text-muted-foreground ring-1 ring-border',
            )}>
            {principal.type === 'DEPARTMENT' ? (
              <UsersIcon className="size-3.5" />
            ) : (
              <UserIcon className="size-3.5" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate">{principalLabel(principal)}</span>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${principal.name}`}
              onClick={() => onRemove(principal)}
            >
              <XIcon />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
