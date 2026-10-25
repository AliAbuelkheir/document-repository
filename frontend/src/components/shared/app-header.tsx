'use client';

import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { toastError } from '@/lib/api-errors';

export function AppHeader() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate(undefined, { onError: toastError });
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
      <Link href="/documents" className="font-semibold">
        Document Repository
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/settings">
            <SettingsIcon />
            Settings
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <UserIcon />
              {user?.name ?? 'Account'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && (
              <DropdownMenuLabel className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.role}</span>
              </DropdownMenuLabel>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={logoutMutation.isPending} onSelect={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
