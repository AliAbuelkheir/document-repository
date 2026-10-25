'use client';

import { cn } from 'cn';
import {
  ChevronsUpDownIcon,
  FileTextIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState } from 'react';

import logo from '@/app/icon.png';
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

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/documents', label: 'Documents', icon: FileTextIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

/** The first letters of the first two words of a name, for example "MH". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join('');
}

function BrandLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/documents"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2',
        'focus-visible:ring-sidebar-ring',
      )}
    >
      <Image src={logo} alt="EEMW" width={32} height={32} className="size-8 rounded-lg" />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">EEMW Documents</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isCurrent = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium',
                  'text-sidebar-foreground/80 transition-colors duration-150 outline-none',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  'focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  isCurrent && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
              >
                {isCurrent && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-sidebar-primary',
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    'size-4',
                    isCurrent ? 'text-sidebar-primary' : 'text-sidebar-muted-foreground',
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AccountMenu() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate(undefined, { onError: toastError });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none',
          'transition-colors duration-150 hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent',
          'focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent',
            'text-xs font-semibold text-sidebar-primary',
          )}
        >
          {user ? initialsOf(user.name) : ''}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{user?.name ?? 'Account'}</span>
          <span className="truncate text-xs text-sidebar-muted-foreground">
            {user?.role === 'ADMIN' ? 'Admin' : 'User'}
          </span>
        </span>
        <ChevronsUpDownIcon className="size-4 text-sidebar-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        {user && (
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={logoutMutation.isPending} onSelect={handleLogout}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The content of the sidebar. The desktop sidebar and the phone menu both use it. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <div className="px-1">
        <BrandLink onNavigate={onNavigate} />
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto border-t border-sidebar-border pt-3">
        <AccountMenu />
      </div>
    </div>
  );
}

/** On phone width, a top bar with a menu button. The button opens the sidebar from the left. */
function MobileBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <header
        className={cn(
          'sticky top-0 z-40 flex h-14 items-center justify-between bg-sidebar px-4',
          'text-sidebar-foreground md:hidden',
        )}>
        <BrandLink />
        <DialogPrimitive.Trigger
          aria-label="Open the menu"
          className={cn(
            'flex size-10 items-center justify-center rounded-full outline-none',
            'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          )}
        >
          <MenuIcon className="size-5" />
        </DialogPrimitive.Trigger>
      </header>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-ink/40 data-open:animate-in data-open:fade-in-0',
            'data-closed:animate-out data-closed:fade-out-0 md:hidden',
          )} />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground',
            'shadow-[8px_0_32px_rgb(15_23_42/0.3)] duration-200 outline-none data-open:animate-in',
            'data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left',
            'md:hidden',
          )}>
          <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            The main navigation and your account.
          </DialogPrimitive.Description>
          <SidebarContent onNavigate={() => setIsOpen(false)} />
          <DialogPrimitive.Close
            aria-label="Close the menu"
            className={cn(
              'absolute top-3.5 right-3 flex size-9 items-center justify-center rounded-full',
              'outline-none hover:bg-sidebar-accent focus-visible:ring-2',
              'focus-visible:ring-sidebar-ring',
            )}
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** The ink sidebar of the app. It is the only dark surface. */
export function AppSidebar() {
  return (
    <>
      <MobileBar />
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh w-58 shrink-0 bg-sidebar text-sidebar-foreground md:block',
        )}>
        <SidebarContent />
      </aside>
    </>
  );
}
