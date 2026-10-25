import { open } from 'node:fs/promises';
import { extname } from 'node:path';

import { fileTypeFromFile } from 'file-type';

import { UnsupportedMediaTypeError } from '../errors/app-error.js';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

interface AllowedFileType {
  /** The MIME type that the API stores and sends. */
  mimeType: string;
  /** Plain text has no magic bytes, so the check reads the text instead. */
  isText?: boolean;
}

const ALLOWED_FILE_TYPES: Record<string, AllowedFileType> = {
  pdf: { mimeType: 'application/pdf' },
  png: { mimeType: 'image/png' },
  jpg: { mimeType: 'image/jpeg' },
  jpeg: { mimeType: 'image/jpeg' },
  webp: { mimeType: 'image/webp' },
  docx: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  xlsx: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  pptx: { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  txt: { mimeType: 'text/plain', isText: true },
  csv: { mimeType: 'text/csv', isText: true },
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_FILE_TYPES);

const INLINE_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

// The text check reads only the start of the file.
const TEXT_SAMPLE_BYTES = 64 * 1024;

function findFileType(filename: string): AllowedFileType | undefined {
  const extension = extname(filename).slice(1).toLowerCase();
  return ALLOWED_FILE_TYPES[extension];
}

/** The first check, before the upload starts: only the extension. */
export function isAllowedExtension(filename: string): boolean {
  return findFileType(filename) !== undefined;
}

/** True if the start of the file is UTF-8 text without NUL bytes. */
async function isUtf8Text(path: string): Promise<boolean> {
  const handle = await open(path);
  try {
    const buffer = Buffer.alloc(TEXT_SAMPLE_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, TEXT_SAMPLE_BYTES, 0);
    const sample = buffer.subarray(0, bytesRead);
    if (sample.includes(0)) {
      return false;
    }
    // `stream: true` accepts a character that the sample cuts at the end.
    new TextDecoder('utf-8', { fatal: true }).decode(sample, { stream: true });
    return true;
  } catch {
    return false;
  } finally {
    await handle.close();
  }
}

/**
 * The second check, after the upload: the content (magic bytes) must match the extension.
 * Returns the MIME type to store.
 */
export async function detectMimeType(path: string, filename: string): Promise<string> {
  const fileType = findFileType(filename);
  if (!fileType) {
    throw new UnsupportedMediaTypeError('This file type is not allowed');
  }

  const detected = await fileTypeFromFile(path);
  if (fileType.isText) {
    if (detected !== undefined || !(await isUtf8Text(path))) {
      throw new UnsupportedMediaTypeError('The file content is not plain UTF-8 text');
    }
    return fileType.mimeType;
  }

  if (detected?.mime !== fileType.mimeType) {
    throw new UnsupportedMediaTypeError('The file content does not match the file extension');
  }
  return fileType.mimeType;
}

/** Only PDF files and images open in the browser. The browser downloads all other files. */
export function canShowInline(mimeType: string): boolean {
  return INLINE_MIME_TYPES.includes(mimeType);
}

/** The Content-Type header value. The upload check accepts only UTF-8 text files. */
export function contentTypeHeader(mimeType: string): string {
  if (mimeType.startsWith('text/')) {
    return `${mimeType}; charset=utf-8`;
  }
  return mimeType;
}
