'use client';

import { cn } from 'cn';
import { SearchIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

/** A pill-shaped search field with a search icon. It has no logic of its own. */
export function SearchBox(props: Omit<ComponentProps<'input'>, 'type' | 'className'>) {
  return (
    <div className="relative w-full sm:max-w-md">
      <SearchIcon
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2',
          'text-muted-foreground',
        )}
      />
      <Input type="search" className="rounded-full pl-9" {...props} />
    </div>
  );
}

interface SearchInputProps {
  value: string;
  /** Called after the user stops typing for 300 ms. */
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [text, setText] = useState(value);
  const [sentText, setSentText] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // When the value changes from outside (for example, "Clear filters"), show the new value.
  // A value that this input sent is not from outside, so the text that the user types stays.
  if (value !== previousValue) {
    setPreviousValue(value);
    if (value !== sentText) {
      setText(value);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextText = event.target.value;
    setText(nextText);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSentText(nextText);
      onChange(nextText);
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <SearchBox
      value={text}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}
