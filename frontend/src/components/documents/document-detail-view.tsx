'use client';

import { cn } from 'cn';
import {
  ChevronLeftIcon,
  CircleAlertIcon,
  DownloadIcon,
  HistoryIcon,
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
import { PageHeader } from '@/components/shared/page-header';
import { QueryError } from '@/components/shared/query-error';
import { TableSkeleton } from '@/components/shared/table-skeleton';
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
      <CircleAlertIcon />
      <AlertTitle>Not found or you do not have access</AlertTitle>
      <AlertDescription>
        <Link href="/documents">Go back to the documents</Link>
      </AlertDescription>
    </Alert>
  );
}

function BackLink() {
  return (
    <Link
      href="/documents"
      className={cn(
        '-mb-2 flex w-fit items-center gap-1 rounded-md text-sm text-muted-foreground outline-none',
        'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <ChevronLeftIcon className="size-4" />
      Documents
    </Link>
  );
}

export function DocumentDetailView() {
  const { id: documentId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const versionNumber = parseVersionNumber(searchParams);
  const documentQuery = useDocument(documentId);
  const versionsQuery = useDocumentVersions(documentId);

  if (documentQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading the document...</p>;
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
    <div className="flex flex-col gap-5">
      <BackLink />

      <DocumentHeader document={document} selectedVersion={selectedVersion} />

      {selectedVersion &&
        selectedVersion.versionNumber !== document.currentVersion.versionNumber && (
          <Alert variant="warning">
            <HistoryIcon />
            <AlertTitle>
              Viewing v{selectedVersion.versionNumber} of {document.currentVersion.versionNumber} -
              not the current version
            </AlertTitle>
            <AlertDescription>
              <Link href={`/documents/${document.id}`}>Show the current version</Link>
            </AlertDescription>
          </Alert>
        )}

      {selectedVersion === undefined && versionsQuery.isSuccess && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Version {versionNumber} does not exist</AlertTitle>
          <AlertDescription>
            <Link href={`/documents/${document.id}`}>Show the current version</Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {selectedVersion && (
            <DocumentPreview documentId={document.id} version={selectedVersion} />
          )}
        </div>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentDetails document={document} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Access</CardTitle>
            </CardHeader>
            <CardContent>
              <AccessSummary document={document} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Version history</CardTitle>
        </CardHeader>
        {versionsQuery.isPending && <TableSkeleton />}
        {versionsQuery.isError && (
          <CardContent className="py-4">
            <QueryError error={versionsQuery.error} onRetry={() => void versionsQuery.refetch()} />
          </CardContent>
        )}
        {versionsQuery.isSuccess && (
          <VersionHistory
            versions={versionsQuery.data}
            currentVersionId={document.currentVersion.id}
            selectedVersionId={selectedVersion?.id ?? ''}
          />
        )}
      </Card>
    </div>
  );
}

/** The owner, the current version and the dates of a document. */
function DocumentDetails({ document }: { document: DocumentDetail }) {
  const current = document.currentVersion;

  return (
    <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-3 text-[13px]">
      <dt className="text-muted-foreground">Owner</dt>
      <dd className="flex min-w-0 flex-col">
        <span className="font-medium">{document.owner.name}</span>
        <span className="truncate text-muted-foreground">{document.owner.email}</span>
      </dd>
      <dt className="text-muted-foreground">Current version</dt>
      <dd className="flex min-w-0 flex-col">
        <span className="font-medium tabular-nums">v{current.versionNumber}</span>
        <span className="truncate text-muted-foreground" title={current.originalFilename}>
          {current.originalFilename}
        </span>
        <span className="text-muted-foreground tabular-nums">{formatBytes(current.sizeBytes)}</span>
      </dd>
      <dt className="text-muted-foreground">Uploaded</dt>
      <dd className="flex flex-col">
        <span>{current.uploadedBy.name}</span>
        <span className="text-muted-foreground tabular-nums">
          {formatDateTime(current.createdAt)}
        </span>
      </dd>
      {current.changeNote && (
        <>
          <dt className="text-muted-foreground">Change note</dt>
          <dd className="break-words">{current.changeNote}</dd>
        </>
      )}
      <dt className="text-muted-foreground">Created</dt>
      <dd className="tabular-nums">{formatDateTime(document.createdAt)}</dd>
    </dl>
  );
}

interface DocumentHeaderProps {
  document: DocumentDetail;
  selectedVersion: VersionFile | undefined;
}

/** The title, the description, the tags and the actions of a document. */
function DocumentHeader({ document, selectedVersion }: DocumentHeaderProps) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<OpenDialog>('none');
  const deleteMutation = useDeleteDocument();

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

  const actions = (
    <>
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
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={document.title} actions={actions} />

      {document.description && (
        <p className="max-w-[72ch] text-sm whitespace-pre-wrap text-muted-foreground">
          {document.description}
        </p>
      )}

      {document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {document.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

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
