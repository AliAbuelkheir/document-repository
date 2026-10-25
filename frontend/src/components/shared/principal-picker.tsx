'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCommandHighlight } from '@/hooks/use-command-highlight';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDepartments } from '@/hooks/use-departments';
import { useUserPicker } from '@/hooks/use-users';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import type { Principal, PrincipalRef } from '@/types/document';

import { LoadMoreSentinel } from './load-more-sentinel';
import { UserPickerStatus } from './user-picker-status';

const USER_VALUE_PREFIX = 'USER:';
const DEPARTMENT_VALUE_PREFIX = 'DEPARTMENT:';

interface PrincipalPickerProps {
  label: string;
  /** The users and departments that are already viewers or editors. The picker hides them. */
  excluded: PrincipalRef[];
  onSelect: (principal: Principal) => void;
}

/** A dropdown to add a user or a department as a viewer or an editor. */
export function PrincipalPicker({ label, excluded, onSelect }: PrincipalPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(principal: Principal) {
    onSelect(principal);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <PlusIcon />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <PrincipalOptions excluded={excluded} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}

function isExcluded(excluded: PrincipalRef[], type: Principal['type'], id: string): boolean {
  return excluded.some((principal) => principal.type === type && principal.id === id);
}

function departmentValue(id: string): string {
  return `${DEPARTMENT_VALUE_PREFIX}${id}`;
}

function userValue(id: string): string {
  return `${USER_VALUE_PREFIX}${id}`;
}

interface PrincipalOptionsProps {
  excluded: PrincipalRef[];
  onSelect: (principal: Principal) => void;
}

function PrincipalOptions({ excluded, onSelect }: PrincipalOptionsProps) {
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), SEARCH_DEBOUNCE_MS);
  const departmentsQuery = useDepartments();
  // Only active users can get access. The API refuses inactive users.
  const usersQuery = useUserPicker(search, true);

  // The list of departments is short, so the browser searches it.
  const lowerSearchText = searchText.trim().toLowerCase();
  const departments = (departmentsQuery.data ?? []).filter(
    (department) =>
      !isExcluded(excluded, 'DEPARTMENT', department.id) &&
      department.name.toLowerCase().includes(lowerSearchText),
  );
  const users = (usersQuery.data?.pages.flatMap((page) => page.data) ?? []).filter(
    (user) => !isExcluded(excluded, 'USER', user.id),
  );
  const highlight = useCommandHighlight([
    ...departments.map((department) => departmentValue(department.id)),
    ...users.map((user) => userValue(user.id)),
  ]);

  return (
    // The items are already searched, so cmdk must not filter them again.
    <Command shouldFilter={false} value={highlight.value} onValueChange={highlight.onValueChange}>
      <CommandInput
        placeholder="Search users or departments"
        value={searchText}
        onValueChange={setSearchText}
      />
      <CommandList>
        {departments.length > 0 && (
          <CommandGroup heading="Departments">
            {departments.map((department) => (
              <CommandItem
                key={department.id}
                value={departmentValue(department.id)}
                onSelect={() =>
                  onSelect({ type: 'DEPARTMENT', id: department.id, name: department.name })
                }
              >
                {department.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Users">
          {users.map((user) => (
            <CommandItem
              key={user.id}
              value={userValue(user.id)}
              onSelect={() => onSelect({ type: 'USER', id: user.id, name: user.name })}
            >
              <span>{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </CommandItem>
          ))}
          <LoadMoreSentinel
            onLoadMore={usersQuery.fetchNextPage}
            isEnabled={usersQuery.hasNextPage && !usersQuery.isFetchingNextPage}
          />
        </CommandGroup>
        <UserPickerStatus
          isPending={usersQuery.isPending || usersQuery.isFetchingNextPage}
          isError={usersQuery.isError}
          isEmpty={usersQuery.isSuccess && users.length === 0}
        />
      </CommandList>
    </Command>
  );
}
