export type SortOrder = 'asc' | 'desc';

export interface PageWindow {
  skip: number;
  take: number;
}

/** The id and display name of a related record, such as an owner or a department. */
export interface NamedRef {
  id: string;
  name: string;
}

/** An array with at least one element. */
export type NonEmptyArray<T> = [T, ...T[]];

export interface ListResult<T> {
  items: T[];
  total: number;
}
