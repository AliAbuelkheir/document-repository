'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
import { useTags } from '@/hooks/use-tags';
import { MAX_TAG_LENGTH, MAX_TAGS } from '@/lib/constants';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  isInvalid?: boolean;
}

function includesIgnoreCase(names: string[], name: string): boolean {
  const lowerName = name.toLowerCase();
  return names.some((item) => item.toLowerCase() === lowerName);
}

/** The tags of a document: active default tags, or custom tags that the user types. */
export function TagInput({ value, onChange, isInvalid = false }: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFull = value.length >= MAX_TAGS;

  function addTag(name: string) {
    if (!includesIgnoreCase(value, name)) {
      onChange([...value, name]);
    }
    setIsOpen(false);
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => removeTag(tag)}>
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFull}
            aria-invalid={isInvalid}
          >
            <PlusIcon />
            {isFull ? `Maximum ${MAX_TAGS} tags` : 'Add tag'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <TagOptions selected={value} onAdd={addTag} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface TagOptionsProps {
  selected: string[];
  onAdd: (name: string) => void;
}

function TagOptions({ selected, onAdd }: TagOptionsProps) {
  const [searchText, setSearchText] = useState('');
  const tagsQuery = useTags({ isActive: true });

  const defaultTags = (tagsQuery.data ?? []).filter(
    (tag) => !includesIgnoreCase(selected, tag.name),
  );
  const defaultTagNames = defaultTags.map((tag) => tag.name);
  const customName = searchText.trim();
  const isCustomNameNew =
    customName !== '' &&
    !includesIgnoreCase(selected, customName) &&
    !includesIgnoreCase(defaultTagNames, customName);
  const isCustomNameTooLong = customName.length > MAX_TAG_LENGTH;

  return (
    <Command>
      <CommandInput
        placeholder="Search or type a new tag"
        value={searchText}
        onValueChange={setSearchText}
      />
      <CommandList>
        <CommandEmpty>No default tags found.</CommandEmpty>
        <CommandGroup heading="Default tags">
          {defaultTags.map((tag) => (
            <CommandItem key={tag.id} value={tag.name} onSelect={() => onAdd(tag.name)}>
              {tag.name}
            </CommandItem>
          ))}
        </CommandGroup>
        {/* The custom group comes last, so Enter selects a matching default tag first. */}
        {isCustomNameNew && (
          // forceMount: cmdk must not hide the group or the item, because it is the typed text.
          <CommandGroup heading="Custom tag" forceMount>
            <CommandItem
              forceMount
              value="__custom__"
              disabled={isCustomNameTooLong}
              onSelect={() => onAdd(customName)}
            >
              {isCustomNameTooLong
                ? `A tag can have at most ${MAX_TAG_LENGTH} characters`
                : `Add "${customName}"`}
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
