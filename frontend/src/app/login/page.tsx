import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Log in - Document Repository',
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {/* The form reads the query string, so it renders in the browser. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
