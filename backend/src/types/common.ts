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

/** The type of a value after `JSON.stringify` and `JSON.parse`: each `Date` becomes a string. */
export type Json<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? Json<Item>[]
    : T extends object
      ? { [Key in keyof T]: Json<T[Key]> }
      : T;
