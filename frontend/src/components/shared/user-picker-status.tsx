interface UserPickerStatusProps {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
}

/** The loading, error or empty message at the end of a user list in a picker. */
export function UserPickerStatus({ isPending, isError, isEmpty }: UserPickerStatusProps) {
  let message = '';
  if (isPending) {
    message = 'Loading users...';
  } else if (isError) {
    message = 'Cannot load the users.';
  } else if (isEmpty) {
    message = 'No users found.';
  }

  if (message === '') {
    return null;
  }
  return <p className="px-2 py-1.5 text-sm text-muted-foreground">{message}</p>;
}
