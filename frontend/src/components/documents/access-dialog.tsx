'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSetPermissions } from '@/hooks/use-documents';
import { showFormError } from '@/lib/api-errors';
import { accessFormSchema } from '@/lib/validation/document.schema';
import type { AccessFormValues } from '@/lib/validation/document.schema';
import type { DocumentDetail, Principal, PrincipalRef } from '@/types/document';

import { AccessFields } from './access-fields';
import type { AccessValue } from './access-fields';

const FIELD_NAMES = ['viewers', 'editors'] as const;

function toPrincipalRef(principal: Principal): PrincipalRef {
  return { type: principal.type, id: principal.id };
}

interface AccessDialogProps {
  document: DocumentDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The owner or an admin changes the visibility, the viewers and the editors here. */
export function AccessDialog({ document, open, onOpenChange }: AccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Access</DialogTitle>
          <DialogDescription>Select who can read and who can edit this document.</DialogDescription>
        </DialogHeader>
        {/* The form mounts each time the dialog opens, so it starts with the current values. */}
        <AccessForm document={document} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface AccessFormProps {
  document: DocumentDetail;
  onDone: () => void;
}

function AccessForm({ document, onDone }: AccessFormProps) {
  const permissionsMutation = useSetPermissions(document.id);
  const form = useForm<AccessFormValues>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: {
      visibility: document.visibility,
      viewers: document.viewers,
      editors: document.editors,
    },
  });
  const { errors } = form.formState;
  const [visibility, viewers, editors] = useWatch({
    control: form.control,
    name: ['visibility', 'viewers', 'editors'],
  });

  function handleAccessChange(access: AccessValue) {
    form.setValue('visibility', access.visibility);
    form.setValue('viewers', access.viewers);
    form.setValue('editors', access.editors);
  }

  function handleSubmit(values: AccessFormValues) {
    const input = {
      visibility: values.visibility,
      viewers: values.viewers.map(toPrincipalRef),
      editors: values.editors.map(toPrincipalRef),
    };
    permissionsMutation.mutate(input, {
      onSuccess: () => {
        toast.success('The access is saved.');
        onDone();
      },
      onError: (error) => showFormError(error, form.setError, FIELD_NAMES),
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
      <AccessFields
        value={{ visibility, viewers, editors }}
        onChange={handleAccessChange}
        viewersError={errors.viewers?.message}
        editorsError={errors.editors?.message}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={permissionsMutation.isPending}>
          {permissionsMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}
