'use client';

import { MultiSelect } from '@/components/shared/multi-select';
import { SearchInput } from '@/components/shared/search-input';
import { UserMultiSelect } from '@/components/shared/user-multi-select';
import { Button } from '@/components/ui/button';
import { useTags } from '@/hooks/use-tags';
import type { SearchParamUpdates } from '@/hooks/use-update-search-params';
import type { DocumentListQuery } from '@/lib/validation/document.schema';

interface DocumentFiltersProps {
  query: DocumentListQuery;
  onChange: (updates: SearchParamUpdates) => void;
}

export function DocumentFilters({ query, onChange }: DocumentFiltersProps) {
  // All default tags, also the inactive ones, so documents with an old tag can still be found.
  const tagsQuery = useTags();
  const tagOptions = (tagsQuery.data ?? []).map((tag) => ({ value: tag.name, label: tag.name }));
  const hasFilters =
    (query.search ?? '') !== '' || query.tags.length > 0 || query.ownerIds.length > 0;

  function clearFilters() {
    onChange({ search: undefined, tags: undefined, ownerIds: undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query.search ?? ''}
        onChange={(search) => onChange({ search })}
        placeholder="Search title, description, file name, tags or uploader"
      />
      <MultiSelect
        label="Tags"
        heading="Documents must have all the selected tags"
        options={tagOptions}
        selected={query.tags}
        onChange={(tags) => onChange({ tags })}
      />
      <UserMultiSelect
        label="Uploader"
        selectedIds={query.ownerIds}
        onChange={(ownerIds) => onChange({ ownerIds })}
      />
      {hasFilters && (
        <Button variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
