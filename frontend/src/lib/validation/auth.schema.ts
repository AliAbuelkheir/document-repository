import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.email('Enter a valid email address').max(254),
  password: z.string().min(1, 'Enter the password').max(72),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

const DEFAULT_RETURN_PATH = '/documents';

/**
 * The page to open after login, from the `next` query parameter.
 * Only a path in this app is accepted, so a link cannot send the user to another site.
 */
export const returnPathSchema = z
  .string()
  .startsWith('/')
  .refine((path) => !path.startsWith('//') && !path.startsWith('/login'))
  .catch(DEFAULT_RETURN_PATH);
