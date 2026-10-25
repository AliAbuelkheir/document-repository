'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDepartment, useUpdateDepartment } from '@/hooks/use-departments';
import { showFormError } from '@/lib/api-errors';
import { departmentFormSchema } from '@/lib/validation/department.schema';
import type { DepartmentFormValues } from '@/lib/validation/department.schema';
import type { Department } from '@/types/department';

export type DepartmentDialogState =
  { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; department: Department };

const FIELD_NAMES = ['name', 'description'] as const;

interface DepartmentDialogProps {
  state: DepartmentDialogState;
  onClose: () => void;
}

export function DepartmentDialog({ state, onClose }: DepartmentDialogProps) {
  function handleOpenChange(open: boolean) {
    if (!open) {
      onClose();
    }
  }

  return (
    <Dialog open={state.mode !== 'closed'} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {state.mode === 'create' && <DepartmentForm onDone={onClose} />}
        {state.mode === 'edit' && <DepartmentForm department={state.department} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

interface DepartmentFormProps {
  /** Without a department, the form adds a new department. */
  department?: Department;
  onDone: () => void;
}

function DepartmentForm({ department, onDone }: DepartmentFormProps) {
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: department?.name ?? '',
      description: department?.description ?? '',
    },
  });
  const { errors } = form.formState;

  function handleSubmit(values: DepartmentFormValues) {
    const input = {
      name: values.name,
      description: values.description === '' ? null : values.description,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success('The department is saved.');
        onDone();
      },
      onError: (error: Error) => showFormError(error, form.setError, FIELD_NAMES),
    };
    if (department) {
      updateMutation.mutate({ id: department.id, input }, callbacks);
    } else {
      createMutation.mutate(input, callbacks);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{department ? 'Edit department' : 'Add a department'}</DialogTitle>
      </DialogHeader>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup>
          <Field data-invalid={errors.name !== undefined}>
            <FieldLabel htmlFor="department-name">Name</FieldLabel>
            <Input
              id="department-name"
              aria-invalid={errors.name !== undefined}
              {...form.register('name')}
            />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={errors.description !== undefined}>
            <FieldLabel htmlFor="department-description">Description</FieldLabel>
            <Textarea
              id="department-description"
              aria-invalid={errors.description !== undefined}
              {...form.register('description')}
            />
            <FieldError errors={[errors.description]} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </form>
    </>
  );
}
