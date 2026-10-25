/** The file types that the API accepts. The API checks them again. */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'docx',
  'xlsx',
  'pptx',
  'txt',
  'csv',
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/** The user pickers load this many users for each page of the infinite scroll. */
export const USER_PICKER_PAGE_SIZE = 50;

export const SEARCH_DEBOUNCE_MS = 300;

/** The browser can show these file types in the page. The other types can only download. */
export const PREVIEW_MIME_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/png', 'image/jpeg', 'image/webp'],
};
