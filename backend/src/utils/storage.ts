import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { env } from '../config/env.js';
import { NotFoundError } from '../errors/app-error.js';

// Uploads go to this directory first. It is on the same volume as the stored files,
// so the move to the final path is atomic.
export const TMP_DIR = resolve(env.UPLOAD_DIR, 'tmp');

function versionPath(documentId: string, versionNumber: number): string {
  return resolve(env.UPLOAD_DIR, documentId, String(versionNumber));
}

export async function createTmpDir(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });
}

/** Moves an uploaded file from the temporary directory to `{documentId}/{versionNumber}`. */
export async function storeVersionFile(
  tmpPath: string,
  documentId: string,
  versionNumber: number,
): Promise<void> {
  await mkdir(resolve(env.UPLOAD_DIR, documentId), { recursive: true });
  await rename(tmpPath, versionPath(documentId, versionNumber));
}

export async function removeVersionFile(documentId: string, versionNumber: number): Promise<void> {
  await rm(versionPath(documentId, versionNumber), { force: true });
}

export async function removeFile(path: string): Promise<void> {
  await rm(path, { force: true });
}

export async function hashFile(path: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

function isMissingFileError(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'ENOENT';
}

export async function openVersionFile(
  documentId: string,
  versionNumber: number,
): Promise<Readable> {
  try {
    const handle = await open(versionPath(documentId, versionNumber));
    return handle.createReadStream();
  } catch (err) {
    if (isMissingFileError(err)) {
      throw new NotFoundError('The file of this version is missing');
    }
    throw err;
  }
}
