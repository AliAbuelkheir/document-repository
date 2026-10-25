import { z } from 'zod';

import { MAX_TAG_LENGTH } from '@/lib/constants';

export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(MAX_TAG_LENGTH, `A tag can have at most ${MAX_TAG_LENGTH} characters`),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
