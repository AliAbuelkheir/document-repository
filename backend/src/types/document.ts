import type { Visibility } from '../generated/prisma/enums.js';

import type { NamedRef, SortOrder } from './common.js';

export type DocumentSortField =
  'relevance' | 'lastVersionAt' | 'title' | 'owner' | 'size' | 'createdAt';

export interface DocumentSearchFilters {
  search?: string;
  tags?: string[];
  ownerIds?: string[];
  sort: DocumentSortField;
  order: SortOrder;
}

export interface DocumentListItem {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  owner: NamedRef;
  tags: string[];
  currentVersion: {
    versionNumber: number;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  };
  lastVersionAt: Date;
  createdAt: Date;
  canWrite: boolean;
  canManage: boolean;
}
