export interface DataResponse<T> {
  data: T;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: PageMeta;
}

/** One validation problem. `path` is the dotted path of the field, such as `viewers.0.id`. */
export interface FieldIssue {
  path: string;
  message: string;
}

/** The id and display name of a related record, such as an owner or a department. */
export interface NamedRef {
  id: string;
  name: string;
}

export type SortOrder = 'asc' | 'desc';
