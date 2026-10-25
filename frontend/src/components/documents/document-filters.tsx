'use client';

import { MultiSelect } from '@/components/shared/multi-select';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { UserMultiSelect } from '@/components/shared/user-multi-select';
import { useTags } from '@/hooks/use-tags';
import type { SearchParamUpdates } from '@/hooks/use-update-search-params';
import { ALLOWED_EXTENSIONS } from '@/lib/constants';
import type { DocumentListQuery } from '@/lib/validation/document.schema';

interface DocumentFiltersProps {
  query: DocumentListQuery;
  onChange: (updates: SearchParamUpdates) => void;
}

export function DocumentFilters({ query, onChange }: DocumentFiltersProps) {
  // Include inactive tags so users can find documents with old tags.
  const tagsQuery = useTags();
  const tagOptions = (tagsQuery.data ?? []).map((tag) => ({ value: tag.name, label: tag.name }));
  const filterCount =
    Number(Boolean(query.search)) + query.tags.length +
    query.ownerIds.length + query.fileTypes.length;

  return (
    <SearchToolbar
      value={query.search ?? ''}
      onSearch={(search) => onChange({ search })}
      placeholder="Search title, description, file name, tags or owner"
      filterCount={filterCount}
      onClear={() => onChange({
        search: undefined,
        tags: undefined,
        ownerIds: undefined,
        fileTypes: undefined,
      })}
    >
      <MultiSelect
        isFilter
        label="Tags"
        heading="Documents must have all the selected tags"
        options={tagOptions}
        selected={query.tags}
        onChange={(tags) => onChange({ tags })}
      />
      <MultiSelect
        isFilter
        label="File type"
        heading="Match any selected type of the latest file"
        options={ALLOWED_EXTENSIONS.map((type) => ({ value: type, label: type.toUpperCase() }))}
        selected={query.fileTypes}
        onChange={(fileTypes) => onChange({ fileTypes })}
      />
      <UserMultiSelect
        label="Uploader"
        selectedIds={query.ownerIds}
        onChange={(ownerIds) => onChange({ ownerIds })}
      />
    </SearchToolbar>
  );
}
