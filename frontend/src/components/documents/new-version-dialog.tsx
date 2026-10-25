'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useCreateVersion } from '@/hooks/use-documents';
import { showFormError } from '@/lib/api-errors';
import { newVersionFormSchema } from '@/lib/validation/document.schema';
import type { NewVersionFormInput, NewVersionFormValues } from '@/lib/validation/document.schema';
import type { DocumentVersion } from '@/types/document';

import { FileDropzone } from './file-dropzone';

const FIELD_NAMES = ['file', 'changeNote'] as const;

interface NewVersionDialogProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the upload, with the new current version. */
  onUploaded: (version: DocumentVersion) => void;
}

export function NewVersionDialog({
  documentId,
  open,
  onOpenChange,
  onUploaded,
}: NewVersionDialogProps) {
  const createMutation = useCreateVersion(documentId);
  const [progress, setProgress] = useState(0);
  const form = useForm<NewVersionFormInput, unknown, NewVersionFormValues>({
    resolver: zodResolver(newVersionFormSchema),
    defaultValues: { file: undefined, changeNote: '' },
  });
  const { errors } = form.formState;

  function handleOpenChange(nextOpen: boolean) {
    // The upload continues in the background if the dialog closes, so it stays open.
    if (createMutation.isPending) {
      return;
    }
    if (!nextOpen) {
      form.reset();
      createMutation.reset();
      setProgress(0);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: NewVersionFormValues) {
    setProgress(0);
    createMutation.mutate(
      { input: values, onProgress: setProgress },
      {
        onSuccess: (version) => {
          toast.success(`Version ${version.versionNumber} is uploaded.`);
          form.reset();
          onOpenChange(false);
          onUploaded(version);
        },
        onError: (error) => showFormError(error, form.setError, FIELD_NAMES),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a new version</DialogTitle>
          <DialogDescription>
            The new version becomes the current version. The old versions stay.
          </DialogDescription>
        </DialogHeader>
        <form id="new-version-form" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Field data-invalid={errors.file !== undefined}>
              <FieldLabel htmlFor="version-file">File</FieldLabel>
              <Controller
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FileDropzone
                    id="version-file"
                    file={field.value}
                    onFileChange={(file) => form.setValue('file', file, { shouldValidate: true })}
                    isInvalid={errors.file !== undefined}
                    disabled={createMutation.isPending}
                  />
                )}
              />
              <FieldError errors={[errors.file]} />
            </Field>
            <Field data-invalid={errors.changeNote !== undefined}>
              <FieldLabel htmlFor="version-note">Change note</FieldLabel>
              <Textarea
                id="version-note"
                placeholder="What changed in this version?"
                aria-invalid={errors.changeNote !== undefined}
                {...form.register('changeNote')}
              />
              <FieldError errors={[errors.changeNote]} />
            </Field>
            {createMutation.isPending && <Progress value={progress} aria-label="Upload progress" />}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={createMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="new-version-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? `Uploading ${progress}%` : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
