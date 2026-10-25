'use client';

import { cn } from 'cn';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          'h-8 gap-2 rounded-md px-3 text-xs shadow-none [&_svg]:text-current',
          value !== 'all' && 'border-primary bg-primary text-primary-foreground',
        )}
      >
        <span className="font-medium">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="start">
        <SelectItem value="all">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
