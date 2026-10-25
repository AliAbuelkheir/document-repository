'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { TagInput } from '@/components/shared/tag-input';
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDocument } from '@/hooks/use-documents';
import { showFormError } from '@/lib/api-errors';
import { filenameWithoutExtension } from '@/lib/format';
import { uploadFormSchema } from '@/lib/validation/document.schema';
import type { UploadFormInput, UploadFormValues } from '@/lib/validation/document.schema';
import type { Principal, PrincipalRef } from '@/types/document';

import { AccessFields } from './access-fields';
import type { AccessValue } from './access-fields';
import { FileDropzone } from './file-dropzone';

const DEFAULT_VALUES: UploadFormInput = {
  file: undefined,
  title: '',
  description: '',
  tags: [],
  visibility: 'PUBLIC',
  viewers: [],
  editors: [],
};

const FIELD_NAMES = ['file', 'title', 'description', 'tags', 'viewers', 'editors'] as const;

function toPrincipalRef(principal: Principal): PrincipalRef {
  return { type: principal.type, id: principal.id };
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentDialog({ open, onOpenChange }: UploadDocumentDialogProps) {
  const router = useRouter();
  const createMutation = useCreateDocument();
  const [progress, setProgress] = useState(0);
  const form = useForm<UploadFormInput, unknown, UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { errors } = form.formState;
  const [visibility, viewers, editors] = useWatch({
    control: form.control,
    name: ['visibility', 'viewers', 'editors'],
  });

  function handleOpenChange(nextOpen: boolean) {
    // The upload continues in the background if the dialog closes, so it stays open.
    if (createMutation.isPending) {
      return;
    }
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      createMutation.reset();
      setProgress(0);
    }
    onOpenChange(nextOpen);
  }

  function handleFileChange(file: File | undefined) {
    const previousFile = form.getValues('file');
    const previousFileTitle = previousFile ? filenameWithoutExtension(previousFile.name) : '';
    const title = form.getValues('title').trim();
    form.setValue('file', file, { shouldValidate: true });
    // The title is the file name, unless the user typed a different title.
    if (file && (title === '' || title === previousFileTitle)) {
      form.setValue('title', filenameWithoutExtension(file.name), { shouldValidate: true });
    }
  }

  function handleAccessChange(access: AccessValue) {
    form.setValue('visibility', access.visibility);
    form.setValue('viewers', access.viewers);
    form.setValue('editors', access.editors);
  }

  function handleSubmit(values: UploadFormValues) {
    setProgress(0);
    const input = {
      file: values.file,
      title: values.title,
      description: values.description,
      tags: values.tags,
      permissions: {
        visibility: values.visibility,
        viewers: values.viewers.map(toPrincipalRef),
        editors: values.editors.map(toPrincipalRef),
      },
    };
    createMutation.mutate(
      { input, onProgress: setProgress },
      {
        onSuccess: (document) => {
          toast.success('The document is uploaded.');
          form.reset(DEFAULT_VALUES);
          onOpenChange(false);
          router.push(`/documents/${document.id}`);
        },
        onError: (error) => showFormError(error, form.setError, FIELD_NAMES),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>The file becomes version 1 of the new document.</DialogDescription>
        </DialogHeader>
        <form id="upload-document-form" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Field data-invalid={errors.file !== undefined}>
              <FieldLabel htmlFor="upload-file">File</FieldLabel>
              <Controller
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FileDropzone
                    id="upload-file"
                    file={field.value}
                    onFileChange={handleFileChange}
                    isInvalid={errors.file !== undefined}
                    disabled={createMutation.isPending}
                  />
                )}
              />
              <FieldError errors={[errors.file]} />
            </Field>

            <Field data-invalid={errors.title !== undefined}>
              <FieldLabel htmlFor="upload-title">Title</FieldLabel>
              <Input
                id="upload-title"
                aria-invalid={errors.title !== undefined}
                {...form.register('title')}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field data-invalid={errors.description !== undefined}>
              <FieldLabel htmlFor="upload-description">Description</FieldLabel>
              <Textarea
                id="upload-description"
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

            <AccessFields
              value={{ visibility, viewers, editors }}
              onChange={handleAccessChange}
              viewersError={errors.viewers?.message}
              editorsError={errors.editors?.message}
            />

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
          <Button type="submit" form="upload-document-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? `Uploading ${progress}%` : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
