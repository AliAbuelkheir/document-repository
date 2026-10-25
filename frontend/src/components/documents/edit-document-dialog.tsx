'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { TagInput } from '@/components/shared/tag-input';
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
import { useUpdateDocument } from '@/hooks/use-documents';
import { showFormError } from '@/lib/api-errors';
import { editDocumentFormSchema } from '@/lib/validation/document.schema';
import type { EditDocumentFormValues } from '@/lib/validation/document.schema';
import type { DocumentDetail } from '@/types/document';

const FIELD_NAMES = ['title', 'description', 'tags'] as const;

interface EditDocumentDialogProps {
  document: DocumentDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDocumentDialog({ document, open, onOpenChange }: EditDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
        </DialogHeader>
        {/* The form mounts each time the dialog opens, so it starts with the current values. */}
        <EditDocumentForm document={document} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface EditDocumentFormProps {
  document: DocumentDetail;
  onDone: () => void;
}

function EditDocumentForm({ document, onDone }: EditDocumentFormProps) {
  const updateMutation = useUpdateDocument(document.id);
  const form = useForm<EditDocumentFormValues>({
    resolver: zodResolver(editDocumentFormSchema),
    defaultValues: {
      title: document.title,
      description: document.description ?? '',
      tags: document.tags,
    },
  });
  const { errors } = form.formState;

  function handleSubmit(values: EditDocumentFormValues) {
    const input = {
      title: values.title,
      description: values.description === '' ? null : values.description,
      tags: values.tags,
    };
    updateMutation.mutate(input, {
      onSuccess: () => {
        toast.success('The details are saved.');
        onDone();
      },
      onError: (error) => showFormError(error, form.setError, FIELD_NAMES),
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
      <FieldGroup>
        <Field data-invalid={errors.title !== undefined}>
          <FieldLabel htmlFor="edit-title">Title</FieldLabel>
          <Input
            id="edit-title"
            aria-invalid={errors.title !== undefined}
            {...form.register('title')}
          />
          <FieldError errors={[errors.title]} />
        </Field>
        <Field data-invalid={errors.description !== undefined}>
          <FieldLabel htmlFor="edit-description">Description</FieldLabel>
          <Textarea
            id="edit-description"
            aria-invalid={errors.description !== undefined}
            {...form.register('description')}
          />
          <FieldError errors={[errors.description]} />
        </Field>
        <Field data-invalid={errors.tags !== undefined}>
          <FieldLabel>Tags</FieldLabel>
          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                isInvalid={errors.tags !== undefined}
              />
            )}
          />
          <FieldError errors={[errors.tags]} />
        </Field>
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
  );
}
