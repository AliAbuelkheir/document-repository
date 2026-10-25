'use client';

import {
  ArrowLeftIcon,
  DownloadIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { QueryError } from '@/components/shared/query-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteDocument, useDocument, useDocumentVersions } from '@/hooks/use-documents';
import { toastError } from '@/lib/api-errors';
import { formatBytes, formatDateTime } from '@/lib/format';
import { parseVersionNumber } from '@/lib/validation/document.schema';
import { ApiError } from '@/services/api-client';
import { versionContentUrl } from '@/services/document.service';
import type { DocumentDetail, DocumentVersion, VersionFile } from '@/types/document';

import { AccessDialog } from './access-dialog';
import { AccessSummary } from './access-summary';
import { DocumentPreview } from './document-preview';
import { EditDocumentDialog } from './edit-document-dialog';
import { NewVersionDialog } from './new-version-dialog';
import { VersionHistory } from './version-history';

type OpenDialog = 'none' | 'newVersion' | 'edit' | 'access' | 'delete';

/** The version that `?version=N` selects, or the current version without `?version`. */
function findSelectedVersion(
  document: DocumentDetail,
  versions: DocumentVersion[] | undefined,
  versionNumber: number | undefined,
): VersionFile | undefined {
  if (versionNumber === undefined || versionNumber === document.currentVersion.versionNumber) {
    return document.currentVersion;
  }
  return versions?.find((version) => version.versionNumber === versionNumber);
}

function NotFoundMessage() {
  return (
    <Alert>
      <AlertTitle>Not found or you do not have access</AlertTitle>
      <AlertDescription>
        <Link href="/documents" className="underline">
          Go back to the documents
        </Link>
      </AlertDescription>
    </Alert>
  );
}

export function DocumentDetailView() {
  const { id: documentId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const versionNumber = parseVersionNumber(searchParams);
  const documentQuery = useDocument(documentId);
  const versionsQuery = useDocumentVersions(documentId);

  if (documentQuery.isPending) {
    return <p className="text-muted-foreground">Loading the document...</p>;
  }
  if (documentQuery.isError) {
    // The API gives 404 also when the user cannot read the document.
    if (documentQuery.error instanceof ApiError && documentQuery.error.status === 404) {
      return <NotFoundMessage />;
    }
    return <QueryError error={documentQuery.error} onRetry={() => void documentQuery.refetch()} />;
  }

  const document = documentQuery.data;
  const selectedVersion = findSelectedVersion(document, versionsQuery.data, versionNumber);

  return (
    <>
      <Link href="/documents" className="flex items-center gap-1 text-sm hover:underline">
        <ArrowLeftIcon className="size-4" />
        Documents
      </Link>

      <DocumentHeader document={document} selectedVersion={selectedVersion} />

      {selectedVersion &&
        selectedVersion.versionNumber !== document.currentVersion.versionNumber && (
          <Alert>
            <AlertTitle>
              Viewing v{selectedVersion.versionNumber} of {document.currentVersion.versionNumber} -
              not the current version
            </AlertTitle>
            <AlertDescription>
              <Link href={`/documents/${document.id}`} className="underline">
                Show the current version
              </Link>
            </AlertDescription>
          </Alert>
        )}

      {selectedVersion === undefined && versionsQuery.isSuccess && (
        <Alert variant="destructive">
          <AlertTitle>Version {versionNumber} does not exist</AlertTitle>
          <AlertDescription>
            <Link href={`/documents/${document.id}`} className="underline">
              Show the current version
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {selectedVersion && <DocumentPreview documentId={document.id} version={selectedVersion} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
          </CardHeader>
          <CardContent>
            <AccessSummary document={document} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Version history</CardTitle>
          </CardHeader>
          <CardContent>
            {versionsQuery.isPending && <p className="text-muted-foreground">Loading...</p>}
            {versionsQuery.isError && (
              <QueryError
                error={versionsQuery.error}
                onRetry={() => void versionsQuery.refetch()}
              />
            )}
            {versionsQuery.isSuccess && (
              <VersionHistory
                versions={versionsQuery.data}
                currentVersionId={document.currentVersion.id}
                selectedVersionId={selectedVersion?.id ?? ''}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface DocumentHeaderProps {
  document: DocumentDetail;
  selectedVersion: VersionFile | undefined;
}

/** The title, the details and the actions of a document. */
function DocumentHeader({ document, selectedVersion }: DocumentHeaderProps) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<OpenDialog>('none');
  const deleteMutation = useDeleteDocument();
  const current = document.currentVersion;

  function setDialogOpen(dialog: OpenDialog, open: boolean) {
    setOpenDialog(open ? dialog : 'none');
  }

  function handleDelete() {
    deleteMutation.mutate(document.id, {
      onSuccess: () => {
        toast.success('The document is deleted.');
        router.replace('/documents');
      },
      onError: (error) => {
        setOpenDialog('none');
        toastError(error);
      },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{document.title}</h1>
          {document.description && (
            <p className="whitespace-pre-wrap text-muted-foreground">{document.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedVersion && (
            <Button asChild>
              <a href={versionContentUrl(document.id, selectedVersion.id, 'attachment')} download>
                <DownloadIcon />
                Download v{selectedVersion.versionNumber}
              </a>
            </Button>
          )}
          {document.canWrite && (
            <>
              <Button variant="outline" onClick={() => setOpenDialog('newVersion')}>
                <UploadIcon />
                Upload new version
              </Button>
              <Button variant="outline" onClick={() => setOpenDialog('edit')}>
                <PencilIcon />
                Edit details
              </Button>
            </>
          )}
          {document.canManage && (
            <>
              <Button variant="outline" onClick={() => setOpenDialog('access')}>
                <ShieldIcon />
                Access
              </Button>
              <Button variant="destructive" onClick={() => setOpenDialog('delete')}>
                <Trash2Icon />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {document.tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Owner</dt>
        <dd>
          {document.owner.name} ({document.owner.email})
        </dd>
        <dt className="text-muted-foreground">Visibility</dt>
        <dd>{document.visibility === 'PUBLIC' ? 'Public' : 'Restricted'}</dd>
        <dt className="text-muted-foreground">Current version</dt>
        <dd>
          v{current.versionNumber}: {current.originalFilename} ({formatBytes(current.sizeBytes)}),
          uploaded by {current.uploadedBy.name} on {formatDateTime(current.createdAt)}
        </dd>
        {current.changeNote && (
          <>
            <dt className="text-muted-foreground">Change note</dt>
            <dd>{current.changeNote}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Created</dt>
        <dd>{formatDateTime(document.createdAt)}</dd>
      </dl>

      <NewVersionDialog
        documentId={document.id}
        open={openDialog === 'newVersion'}
        onOpenChange={(open) => setDialogOpen('newVersion', open)}
        // Show the new current version, also if an old version was shown.
        onUploaded={() => router.replace(`/documents/${document.id}`)}
      />
      <EditDocumentDialog
        document={document}
        open={openDialog === 'edit'}
        onOpenChange={(open) => setDialogOpen('edit', open)}
      />
      <AccessDialog
        document={document}
        open={openDialog === 'access'}
        onOpenChange={(open) => setDialogOpen('access', open)}
      />
      <ConfirmDialog
        open={openDialog === 'delete'}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        title="Delete this document?"
        description={`"${document.title}" and all its versions will be removed from the list.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
        isDestructive
      />
    </div>
  );
}
