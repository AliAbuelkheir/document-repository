'use client';

import { CheckIcon, ChevronDownIcon, ChevronsUpDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  isInvalid?: boolean;
  isFilter?: boolean;
  /** A short text above the choices, for example how the selected choices combine. */
  heading?: string;
}

/** The look of a dropdown trigger that has selected choices. */
export const ACTIVE_TRIGGER_CLASS = 'border-primary/30 bg-selected text-primary hover:bg-selected';

/** The number of selected choices, in a small teal bubble. */
export function SelectedCount({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-primary px-1.5 text-[11px] leading-4 text-primary-foreground">
      {count}
    </span>
  );
}

/** A dropdown with a search box and many choices. The search runs in the browser (cmdk). */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  isInvalid = false,
  isFilter = false,
  heading,
}: MultiSelectProps) {
  let selectionLabel = 'All';
  if (selected.length === 1) {
    const selectedOption = options.find((option) => option.value === selected[0]);
    selectionLabel = selectedOption?.label ?? selected[0] ?? 'All';
  } else if (selected.length > 1) {
    selectionLabel = `${selected.length} selected`;
  }
  let triggerClass = selected.length > 0 ? ACTIVE_TRIGGER_CLASS : undefined;
  if (isFilter) {
    triggerClass = 'h-8 gap-2 rounded-md px-3 text-xs shadow-none';
  }

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={isFilter && selected.length > 0 ? 'default' : 'outline'}
          aria-invalid={isInvalid}
          className={triggerClass}
        >
          {label}
          {isFilter ? (
            <>
              <span className="max-w-40 truncate font-normal">{selectionLabel}</span>
              <ChevronDownIcon className="size-3" />
            </>
          ) : (
            <>
              {selected.length > 0 && <SelectedCount count={selected.length} />}
              <ChevronsUpDownIcon />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading={heading}>
              {options.map((option) => (
                // The label is the value, so the search matches the text that the user sees.
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggle(option.value)}
                >
                  <CheckIcon
                    className={selected.includes(option.value) ? 'opacity-100' : 'opacity-0'}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.length > 0 && (
              <CommandGroup>
                <CommandItem value="__clear__" onSelect={() => onChange([])}>
                  Clear selection
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
