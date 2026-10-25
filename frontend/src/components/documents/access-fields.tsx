'use client';

import { useId, useState } from 'react';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PrincipalPicker } from '@/components/shared/principal-picker';
import { Field, FieldDescription, FieldError, FieldLabel, FieldSet } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import type { Principal, Visibility } from '@/types/document';

import { PrincipalList } from './principal-list';

export interface AccessValue {
  visibility: Visibility;
  viewers: Principal[];
  editors: Principal[];
}

interface AccessFieldsProps {
  value: AccessValue;
  onChange: (value: AccessValue) => void;
  viewersError?: string;
  editorsError?: string;
}

function isSamePrincipal(first: Principal, second: Principal): boolean {
  return first.type === second.type && first.id === second.id;
}

/**
 * The visibility, viewers and editors of a document.
 * Viewers show only for a restricted document. Editors show always.
 */
export function AccessFields({ value, onChange, viewersError, editorsError }: AccessFieldsProps) {
  const switchId = useId();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isPublic = value.visibility === 'PUBLIC';
  const usedPrincipals = [...value.viewers, ...value.editors];

  function handlePublicChange(checked: boolean) {
    if (!checked) {
      onChange({ ...value, visibility: 'RESTRICTED' });
      return;
    }
    // A public document cannot have viewers, so ask before they are removed.
    if (value.viewers.length > 0) {
      setIsConfirmOpen(true);
      return;
    }
    onChange({ ...value, visibility: 'PUBLIC' });
  }

  function makePublic() {
    onChange({ ...value, visibility: 'PUBLIC', viewers: [] });
    setIsConfirmOpen(false);
  }

  return (
    <FieldSet>
      <Field orientation="horizontal">
        <Switch id={switchId} checked={isPublic} onCheckedChange={handlePublicChange} />
        <FieldLabel htmlFor={switchId}>Public</FieldLabel>
      </Field>
      <FieldDescription>
        {isPublic
          ? 'All users can read this document.'
          : 'Only the owner, the viewers, the editors and admins can read this document.'}
      </FieldDescription>

      {!isPublic && (
        <Field data-invalid={viewersError !== undefined}>
          <FieldLabel>Viewers</FieldLabel>
          <PrincipalPicker
            label="Add user or department"
            excluded={usedPrincipals}
            onSelect={(principal) => onChange({ ...value, viewers: [...value.viewers, principal] })}
          />
          <PrincipalList
            principals={value.viewers}
            emptyMessage="No viewers."
            onRemove={(principal) =>
              onChange({
                ...value,
                viewers: value.viewers.filter((viewer) => !isSamePrincipal(viewer, principal)),
              })
            }
          />
          <FieldError>{viewersError}</FieldError>
        </Field>
      )}

      <Field data-invalid={editorsError !== undefined}>
        <FieldLabel>Editors</FieldLabel>
        <FieldDescription>Editors can upload new versions and edit the details.</FieldDescription>
        <PrincipalPicker
          label="Add user or department"
          excluded={usedPrincipals}
          onSelect={(principal) => onChange({ ...value, editors: [...value.editors, principal] })}
        />
        <PrincipalList
          principals={value.editors}
          emptyMessage="No editors."
          onRemove={(principal) =>
            onChange({
              ...value,
              editors: value.editors.filter((editor) => !isSamePrincipal(editor, principal)),
            })
          }
        />
        <FieldError>{editorsError}</FieldError>
      </Field>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Make the document public?"
        description={`Viewers to remove: ${value.viewers.length}. The editors stay.`}
        confirmLabel="Make public"
        onConfirm={makePublic}
      />
    </FieldSet>
  );
}
