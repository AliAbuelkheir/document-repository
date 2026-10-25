'use client';

import { useState } from 'react';

/**
 * The highlighted item of a cmdk list whose items come from the API.
 * cmdk keeps the old highlighted value when the API results replace the items,
 * and then Enter selects nothing. This hook highlights the first item when the old one is gone.
 * Give the result to `<Command value onValueChange>`.
 */
export function useCommandHighlight(itemValues: string[]) {
  const [activeValue, setActiveValue] = useState('');

  let value = activeValue;
  if (!itemValues.includes(activeValue)) {
    value = itemValues[0] ?? '';
  }
  return { value, onValueChange: setActiveValue };
}
