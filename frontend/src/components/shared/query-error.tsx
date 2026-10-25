'use client';

import { CircleAlertIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api-errors';

interface QueryErrorProps {
  error: unknown;
  onRetry: () => void;
  title?: string;
}

/** The inline state of a query that failed, with a Retry button. */
export function QueryError({ error, onRetry, title = 'Cannot load the data' }: QueryErrorProps) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        <span>{errorMessage(error)}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
