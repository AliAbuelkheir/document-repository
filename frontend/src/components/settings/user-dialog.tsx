'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { MultiSelect } from '@/components/shared/multi-select';
import { QueryError } from '@/components/shared/query-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useIsAdmin } from '@/hooks/use-auth';
import { useDepartments } from '@/hooks/use-departments';
import { useCreateUser, useUpdateUser, useUser } from '@/hooks/use-users';
import { showFormError } from '@/lib/api-errors';
import { formatDateTime } from '@/lib/format';
import { createUserFormSchema, editUserFormSchema } from '@/lib/validation/user.schema';
import type { CreateUserFormValues, EditUserFormValues } from '@/lib/validation/user.schema';
import type { User } from '@/types/user';

export type UserDialogState =
  { mode: 'closed' } | { mode: 'create' } | { mode: 'details'; userId: string };

interface UserDialogProps {
  state: UserDialogState;
  onClose: () => void;
}

/** Add a user (admin), or show a user. An admin can also edit the user. */
export function UserDialog({ state, onClose }: UserDialogProps) {
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={state.mode !== 'closed'} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {state.mode === 'create' && <CreateUserForm onDone={onClose} />}
        {state.mode === 'details' && <UserDetails userId={state.userId} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

const ROLE_LABELS = { ADMIN: 'Admin', USER: 'User' };

// ---- Fields that the create form and the edit form share ----

interface SharedFieldsValues {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  departmentIds: string[];
}

/** The fields of both user forms. They read the form from the `FormProvider` around them. */
function SharedUserFields({ passwordDescription }: { passwordDescription: string }) {
  const { register, control, formState } = useFormContext<SharedFieldsValues>();
  const { errors } = formState;
  const selectedDepartmentIds = useWatch({ control, name: 'departmentIds' });
  const departmentsQuery = useDepartments();
  const departmentOptions = (departmentsQuery.data ?? []).map((department) => ({
    value: department.id,
    label: department.name,
  }));
  const selectedDepartmentNames = departmentOptions
    .filter((option) => selectedDepartmentIds.includes(option.value))
    .map((option) => option.label);

  return (
    <>
      <Field data-invalid={errors.name !== undefined}>
        <FieldLabel htmlFor="user-name">Name</FieldLabel>
        <Input id="user-name" aria-invalid={errors.name !== undefined} {...register('name')} />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={errors.email !== undefined}>
        <FieldLabel htmlFor="user-email">Email</FieldLabel>
        <Input
          id="user-email"
          type="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        <FieldError errors={[errors.email]} />
      </Field>
      <Field data-invalid={errors.password !== undefined}>
        <FieldLabel htmlFor="user-password">Password</FieldLabel>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password !== undefined}
          {...register('password')}
        />
        <FieldDescription>{passwordDescription}</FieldDescription>
        <FieldError errors={[errors.password]} />
      </Field>
      <Field data-invalid={errors.departmentIds !== undefined}>
        <FieldLabel>Departments</FieldLabel>
        <Controller
          control={control}
          name="departmentIds"
          render={({ field }) => (
            <MultiSelect
              label="Departments"
              options={departmentOptions}
              selected={field.value}
              onChange={field.onChange}
              isInvalid={errors.departmentIds !== undefined}
            />
          )}
        />
        <FieldDescription>{selectedDepartmentNames.join(', ')}</FieldDescription>
        <FieldError errors={[errors.departmentIds]} />
      </Field>
      <Field data-invalid={errors.role !== undefined}>
        <FieldLabel htmlFor="user-role">Role</FieldLabel>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="user-role" aria-invalid={errors.role !== undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{ROLE_LABELS.USER}</SelectItem>
                <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.role]} />
      </Field>
    </>
  );
}

// ---- Create ----

const CREATE_FIELD_NAMES = ['name', 'email', 'password', 'role', 'departmentIds'] as const;

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateUser();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { name: '', email: '', password: '', role: 'USER', departmentIds: [] },
  });

  function handleSubmit(values: CreateUserFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('The user is added.');
        onDone();
      },
      onError: (error) => showFormError(error, form.setError, CREATE_FIELD_NAMES),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a user</DialogTitle>
      </DialogHeader>
      <FormProvider {...form}>
        <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <SharedUserFields passwordDescription="At least 8 characters." />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add user'}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </FormProvider>
    </>
  );
}

// ---- Details and edit ----

function UserDetails({ userId, onDone }: { userId: string; onDone: () => void }) {
  const isAdmin = useIsAdmin();
  const userQuery = useUser(userId);

  if (userQuery.isPending) {
    return <DialogTitle>Loading the user...</DialogTitle>;
  }
  if (userQuery.isError) {
    return (
      <>
        <DialogTitle>User</DialogTitle>
        <QueryError error={userQuery.error} onRetry={() => void userQuery.refetch()} />
      </>
    );
  }
  if (isAdmin) {
    return <EditUserForm user={userQuery.data} onDone={onDone} />;
  }
  return <UserSummary user={userQuery.data} />;
}

function UserSummary({ user }: { user: User }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{user.name}</DialogTitle>
        <DialogDescription>{user.email}</DialogDescription>
      </DialogHeader>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Departments</dt>
        <dd>{user.departments.map((department) => department.name).join(', ')}</dd>
        <dt className="text-muted-foreground">Role</dt>
        <dd>{ROLE_LABELS[user.role]}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{user.isActive ? 'Active' : 'Inactive'}</dd>
        <dt className="text-muted-foreground">Created</dt>
        <dd>{formatDateTime(user.createdAt)}</dd>
      </dl>
    </>
  );
}

const EDIT_FIELD_NAMES = [
  'name',
  'email',
  'password',
  'role',
  'isActive',
  'departmentIds',
] as const;

function EditUserForm({ user, onDone }: { user: User; onDone: () => void }) {
  const updateMutation = useUpdateUser();
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
      departmentIds: user.departments.map((department) => department.id),
    },
  });
  const { errors } = form.formState;

  function handleSubmit(values: EditUserFormValues) {
    const input = {
      name: values.name,
      email: values.email,
      role: values.role,
      isActive: values.isActive,
      departmentIds: values.departmentIds,
      // An empty password keeps the current password.
      password: values.password === '' ? undefined : values.password,
    };
    updateMutation.mutate(
      { id: user.id, input },
      {
        onSuccess: () => {
          toast.success('The user is saved.');
          onDone();
        },
        onError: (error) => showFormError(error, form.setError, EDIT_FIELD_NAMES),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
        <DialogDescription>Created {formatDateTime(user.createdAt)}</DialogDescription>
      </DialogHeader>
      <FormProvider {...form}>
        <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <SharedUserFields passwordDescription="Leave empty to keep the current password." />
            <Field orientation="horizontal" data-invalid={errors.isActive !== undefined}>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="user-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <FieldLabel htmlFor="user-active">Active</FieldLabel>
            </Field>
            <FieldError errors={[errors.isActive]} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onDone}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </FormProvider>
    </>
  );
}
