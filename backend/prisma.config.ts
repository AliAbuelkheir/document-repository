import { defineConfig } from 'prisma/config';
import { z } from 'zod';

// Optional, because `prisma generate` runs in the Docker build, where there is no database.
const databaseUrl = z
  .url({ protocol: /^postgres(ql)?$/ })
  .optional()
  .parse(process.env.DATABASE_URL);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node dist/prisma/seed/index.js',
  },
  datasource: { url: databaseUrl },
});
