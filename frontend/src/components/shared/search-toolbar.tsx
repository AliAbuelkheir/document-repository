'use client';

import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchToolbarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
  filterCount: number;
  onClear: () => void;
  children?: ReactNode;
  actions?: ReactNode;
}

export function SearchToolbar({
  value,
  onSearch,
  placeholder,
  filterCount,
  onClear,
  children,
  actions,
}: SearchToolbarProps) {
  const [search, setSearch] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  if (value !== previousValue) {
    setPreviousValue(value);
    setSearch(value);
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(search);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 rounded-md bg-muted/50 pl-9"
          />
        </div>
        <Button type="submit" size="icon-lg" className="rounded-md" aria-label="Search">
          <SearchIcon aria-hidden />
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto rounded-md text-primary"
          disabled={filterCount === 0 && search === ''}
          onClick={() => {
            setSearch('');
            onClear();
          }}
        >
          Clear filters
          {filterCount > 0 && (
            <span className="rounded bg-selected px-1.5 text-xs tabular-nums">{filterCount}</span>
          )}
        </Button>
        {actions}
      </div>
    </div>
  );
}
