'use client';

import { CheckIcon, ChevronDownIcon } from 'lucide-react';
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
import { useUserPicker, useUsersByIds } from '@/hooks/use-users';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

import { LoadMoreSentinel } from './load-more-sentinel';
import { UserPickerStatus } from './user-picker-status';

interface UserMultiSelectProps {
  label: string;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

/** A dropdown to select users. The API searches the users, 50 at a time (infinite scroll). */
export function UserMultiSelect({ label, selectedIds, onChange }: UserMultiSelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={selectedIds.length > 0 ? 'default' : 'outline'}
          className="h-8 gap-2 rounded-md px-3 text-xs shadow-none"
        >
          {label}
          <span className="font-normal">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'All'}
          </span>
          <ChevronDownIcon className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        {/* The content mounts only while the dropdown is open, so the users load only then. */}
        <UserOptions selectedIds={selectedIds} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

interface UserOptionsProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

function UserOptions({ selectedIds, onChange }: UserOptionsProps) {
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), SEARCH_DEBOUNCE_MS);
  // Inactive users can still own documents, so the filter shows them too.
  const usersQuery = useUserPicker(search, false);
  const selectedUserQueries = useUsersByIds(selectedIds);

  const users = usersQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const unselectedUsers = users.filter((user) => !selectedIds.includes(user.id));
  const highlight = useCommandHighlight([
    ...selectedIds.map((userId) => `selected:${userId}`),
    ...unselectedUsers.map((user) => user.id),
  ]);

  function select(userId: string) {
    onChange([...selectedIds, userId]);
  }

  function unselect(userId: string) {
    onChange(selectedIds.filter((id) => id !== userId));
  }

  return (
    // The API searches, so cmdk must not filter the items again.
    <Command shouldFilter={false} value={highlight.value} onValueChange={highlight.onValueChange}>
      <CommandInput placeholder="Search users" value={searchText} onValueChange={setSearchText} />
      <CommandList>
        {selectedIds.length > 0 && (
          <CommandGroup heading="Selected">
            {selectedIds.map((userId, index) => (
              <CommandItem
                key={userId}
                value={`selected:${userId}`}
                onSelect={() => unselect(userId)}
              >
                <CheckIcon />
                {selectedUserQueries[index]?.data?.name ?? 'Loading...'}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Users">
          {unselectedUsers.map((user) => (
            <CommandItem key={user.id} value={user.id} onSelect={() => select(user.id)}>
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
