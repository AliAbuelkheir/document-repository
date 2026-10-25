'use client';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Shows when a page has an error that no component catches. */
export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">The page cannot show. Try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
