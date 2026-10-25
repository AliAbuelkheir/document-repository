import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';

import { ApiError } from '@/services/api-client';

const GENERIC_MESSAGE = 'Something went wrong. Try again.';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return GENERIC_MESSAGE;
}

/** Shows the error of a failed action in a toast. */
export function toastError(error: unknown): void {
  toast.error(errorMessage(error));
}

/**
 * The form field of an API error path. The API puts the upload permissions under
 * `permissions.`, and a list item has an index, so `permissions.viewers.0.id` gives `viewers`.
 */
function toFieldName(path: string): string {
  const pathWithoutPrefix = path.replace(/^permissions\./, '');
  const [fieldName = ''] = pathWithoutPrefix.split('.');
  return fieldName;
}

/**
 * Shows the field problems of an API error on the form fields.
 * If no problem matches a field in `fieldNames`, it shows the error in a toast.
 */
export function showFormError<TFields extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFields>,
  fieldNames: readonly Path<TFields>[],
): void {
  if (!(error instanceof ApiError)) {
    toastError(error);
    return;
  }

  let isShownOnField = false;
  for (const issue of error.details) {
    const fieldName = fieldNames.find((name) => name === toFieldName(issue.path));
    if (fieldName !== undefined) {
      setError(fieldName, { type: 'server', message: issue.message });
      isShownOnField = true;
    }
  }
  if (!isShownOnField) {
    toastError(error);
  }
}
