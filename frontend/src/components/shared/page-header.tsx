import { cn } from 'cn';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  /** A short line under the title, for example a count. */
  description?: ReactNode;
  actions?: ReactNode;
}

/** The title row at the top of a page. The title uses the EEMW display face. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1
          className={cn(
            'font-display text-[26px] leading-tight font-semibold tracking-[-0.02em] text-balance',
          )}>
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
