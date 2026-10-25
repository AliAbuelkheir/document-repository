import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page does not exist.</p>
      <Button asChild>
        <Link href="/documents">Go to the documents</Link>
      </Button>
    </main>
  );
}
