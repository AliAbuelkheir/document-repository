import type { NamedRef, SortOrder } from './api';

export type Visibility = 'PUBLIC' | 'RESTRICTED';

export type PrincipalType = 'USER' | 'DEPARTMENT';

/** A user or a department, as the API takes it in the viewers and editors lists. */
export interface PrincipalRef {
  type: PrincipalType;
  id: string;
}

/** A user or a department, as the API sends it in the viewers and editors lists. */
export interface Principal extends PrincipalRef {
  name: string;
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
  lastVersionAt: string;
  createdAt: string;
  canWrite: boolean;
  canManage: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  changeNote: string | null;
  createdAt: string;
  uploadedBy: NamedRef;
}

/** The fields of a version that the preview and the download need. */
export type VersionFile = Pick<
  DocumentVersion,
  'id' | 'versionNumber' | 'originalFilename' | 'mimeType' | 'sizeBytes'
>;

export interface DocumentDetail {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  tags: string[];
  owner: NamedRef & { email: string };
  currentVersion: Omit<DocumentVersion, 'documentId'>;
  viewers: Principal[];
  editors: Principal[];
  lastVersionAt: string;
  createdAt: string;
  updatedAt: string;
  canWrite: boolean;
  canManage: boolean;
}

export type DocumentSortField =
  'relevance' | 'lastVersionAt' | 'title' | 'owner' | 'size' | 'createdAt';

export interface DocumentListParams {
  search?: string;
  tags?: string[];
  ownerIds?: string[];
  fileTypes?: string[];
  sort?: DocumentSortField;
  order?: SortOrder;
  page: number;
  pageSize: number;
}

export interface PermissionsInput {
  visibility: Visibility;
  viewers: PrincipalRef[];
  editors: PrincipalRef[];
}

export interface CreateDocumentInput {
  file: File;
  title: string;
  description: string;
  tags: string[];
  permissions: PermissionsInput;
}

export interface UpdateDocumentInput {
  title: string;
  description: string | null;
  tags: string[];
}

export interface CreateVersionInput {
  file: File;
  changeNote: string;
}

export type ContentDisposition = 'inline' | 'attachment';
