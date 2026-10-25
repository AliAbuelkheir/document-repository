'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Input } from '@/components/ui/input';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

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
    <Input
      type="search"
      value={text}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={placeholder}
      className="max-w-sm"
    />
  );
}
