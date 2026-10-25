'use client';

import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Shows when the root layout has an error. It replaces the root layout, so it has its own html. */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p>The application cannot show. Try again.</p>
        <button type="button" className="rounded-lg border px-3 py-1.5" onClick={reset}>
          Try again
        </button>
      </body>
    </html>
  );
}
