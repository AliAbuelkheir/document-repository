import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';
import { env } from './env.js';

// Fuzzy search (`<%` operator) matches when pg_trgm word similarity >= this value.
const WORD_SIMILARITY_THRESHOLD = 0.4;

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
    options: `-c pg_trgm.word_similarity_threshold=${WORD_SIMILARITY_THRESHOLD}`,
  }),
});

export type DbClient = PrismaClient | Prisma.TransactionClient;
