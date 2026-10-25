import type { Visibility } from '../generated/prisma/enums.js';
import type { DocumentDetailRecord } from '../models/document.model.js';

import type { Json, NamedRef, SortOrder } from './common.js';

export type DocumentSortField =
  'relevance' | 'lastVersionAt' | 'title' | 'owner' | 'size' | 'createdAt';

export interface DocumentSearchFilters {
  search?: string;
  tags?: string[];
  ownerIds?: string[];
  fileTypes?: string[];
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

/** A file that the upload middleware saved in the temporary directory. */
export interface UploadedFile {
  path: string;
  originalName: string;
  sizeBytes: number;
}

/** A user or a department in the viewers or editors of a document. */
export interface Principal {
  type: 'USER' | 'DEPARTMENT';
  id: string;
  name: string;
}

/** The document detail that the API sends. The cache stores it with dates as strings. */
export type DocumentDetail = Omit<Json<DocumentDetailRecord>, 'permissions'> & {
  viewers: Principal[];
  editors: Principal[];
  canWrite: boolean;
  canManage: boolean;
};
