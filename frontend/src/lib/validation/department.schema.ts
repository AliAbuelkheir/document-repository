import { z } from 'zod';

export const departmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(100, 'The name can have at most 100 characters'),
  description: z.string().trim().max(500, 'The description can have at most 500 characters'),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
