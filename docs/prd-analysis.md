# Assessment requirements and implementation assumptions

Review date: October 25, 2026.
Source: [Technical Assessment.pdf](Technical%20Assessment.pdf), pages 1-3.

This review compares the PDF with the current source, schema, configuration, and interface
documents.
It includes current uncommitted source changes.
It excludes deleted design drafts as evidence of current behavior.

The PDF requests a minimal POC and explicitly welcomes extra ideas as bonuses on page 2.
An extra feature is not automatically a defect or a requirement.
The PDF does not define a complete product contract for access, search, or document lifecycle rules.
The implementation supplies those rules.

## Classification

| Class | Meaning |
| --- | --- |
| Required | The PDF explicitly requests the capability or deliverable. |
| Assumption | The implementation selects behavior that the PDF leaves open. |
| Bonus | The implementation adds a user capability that the PDF does not request. |
| Choice | The implementation selects a technology or internal mechanism. |
| Gap | Evidence does not establish a requested outcome. |

A required capability can contain several assumptions.
For example, department restrictions are required, but admin access to every document is an
assumption.
The entries below describe current code, not approval from the assessment author.

## Explicit requirements

| PDF reference | Required outcome | Current source evidence |
| --- | --- | --- |
| Page 1, system design | Upload and retain files | Document service and upload volume |
| Page 1, metadata | Title, tags, permissions, versions | Prisma schema and document validators |
| Pages 1-2, search | Search by title, tags, uploader | Document search model and filters |
| Pages 1-2, access | View and download documents | Detail view and version content endpoint |
| Page 1, users | Users with department and role | Users and department membership tables |
| Page 1, tags | Multiple tags per document | Document tag array |
| Pages 1-2, versions | Replace current and retain history | Current pointer and history |
| Page 1, permissions | Restrict some documents to departments | Department access grants |
| Page 2, backend | Node.js REST API with PostgreSQL | Express routes, services, and models |
| Page 2, frontend | Next.js App Router, three core views | Upload, list, and detail views |
| Page 2, layers | Separate routes, business rules, and data access | Backend directories |
| Page 2, database | Sensible keys, relations, and search indexes | Schema and initial migration |
| Page 2, Docker | Start database services with one command | Root Compose file |
| Pages 2-3, validation | API input checks and useful HTTP errors | Zod and error middleware |
| Page 3, organization | Consistent style and organized files | Tailwind and feature directories |
| Pages 1 and 3, design | Architecture diagram and design choices | Architecture document |
| Page 3, README | Summary, assumptions, local run steps, Node version, next steps | README |
| Pages 2-3, submission | GitHub, commit history, video, links | Submission work |

The PDF prefers TypeScript but permits JavaScript.
It permits local files or a Docker volume and does not require an external database.
Redis and the full application in Compose are explicit optional enhancements.
The example `npm run dev` commands do not require a separate host installation method.

## Identity and users

Evidence: [auth service](../backend/src/services/auth.service.ts),
[auth controller](../backend/src/controllers/auth.controller.ts),
[user service](../backend/src/services/user.service.ts),
[user validators](../backend/src/validators/user.schema.ts),
and [user routes](../backend/src/routes/user.routes.ts).

- **A01 - Login and logout: Bonus.** The PDF requests security but does not specify a login page.
  The application uses an email address and password, not corporate SSO.

- **A02 - Account administration: Bonus.** Admins create and edit accounts, reset passwords,
  and activate or deactivate users. The PDF only requests users in the schema.

- **A03 - Role meanings: Assumption.** The application defines `ADMIN` and `USER`.
  The PDF requests a role but defines no role names or powers.

- **A04 - Multiple departments: Assumption.** Each account must have at least one department.
  It can have several departments. The PDF refers to a user's department without a cardinality rule.

- **A05 - Account retention: Assumption.** Deactivation replaces user deletion.
  Prior documents and version authors remain in the database.

- **A06 - Admin self-protection: Bonus.** An admin cannot deactivate the same account
  or remove its own admin role through the account update endpoint.

- **A07 - Directory visibility: Assumption.** Every user who signs in can read user records,
  departments, and tags. Only admins can change these catalogs.
  The PDF does not authorize a company-wide directory or define email visibility.

- **A08 - Session contract: Choice.** The API uses an HS256 JWT in an HttpOnly cookie.
  Sessions last eight hours. The cookie uses `SameSite=Lax` and no Secure flag for local HTTP.

- **A09 - Logout and password reset: Assumption.** Logout clears the browser cookie.
  Password changes do not revoke an valid token. There is no token revocation store.
  Account deactivation blocks later authenticated requests through the current user lookup.

- **A10 - Password and identity rules: Choice.** User validators require 8-72 password characters,
  lowercase email addresses, and unique accounts. bcrypt hashes passwords.
  These exact rules do not appear in the PDF.

- **A11 - Account creation flow: Assumption.** Admin creation and the sample seed supply accounts.
  The application has no self-registration, password recovery, or invitation flow.

The PDF does not require SSO, MFA, or password recovery.
Their absence is not a direct failure against an explicit feature list.

## Permissions and document ownership

Evidence: [permission rules](../backend/src/utils/permissions.ts),
[document service](../backend/src/services/document.service.ts),
[document validators](../backend/src/validators/document.schema.ts),
and [access form](../frontend/src/components/documents/access-fields.tsx).

- **A12 - Original ownership: Assumption.** The creator owns the document permanently.
  Later uploads record a version author and do not transfer ownership.

- **A13 - Default visibility: Assumption.** New documents default to `PUBLIC`.
  The PDF does not define a default or require an explicit visibility choice.

- **A14 - Public scope: Assumption.** Public means all users who sign in.
  Anonymous users cannot read public documents or download their files.

- **A15 - Individual access: Bonus.** A document can grant access to specific users.
  The PDF explicitly mentions department restrictions, not individual grants.

- **A16 - Viewer and editor levels: Bonus.** Grants can have `VIEW` or `EDIT` access.
  Editors can read, edit metadata, and upload new versions.

- **A17 - Owner and admin access: Assumption.** Owners and admins can read and change any
  document that they own or administer. Admins bypass department restrictions.

- **A18 - Manage authority: Assumption.** Only owners and admins can change grants or delete
  a document. An editor cannot grant access or delete it.

- **A19 - Combined grants: Assumption.** Access from any user or department grant is sufficient.
  The system has no explicit deny rule. Edit access also gives read access.

- **A20 - Empty restrictions: Assumption.** A restricted document can have no viewer or editor.
  Only the owner and admins can then read it.

- **A21 - Public grant rules: Assumption.** Public documents retain editors but cannot have viewers.
  The interface requests confirmation before it removes viewers to make a document public.

- **A22 - Grant replacement: Choice.** The permissions PUT request replaces the entire grant list.
  A principal can appear once across the viewer and editor lists.

- **A23 - Grant validity and limits: Choice.** Each list accepts at most 200 principals.
  User grants require active users. Department grants require valid departments.

- **A24 - Concealed documents: Assumption.** An unreadable document returns 404, like an unknown ID.
  Search excludes documents that the user cannot read.

- **A25 - Historical access: Assumption.** Current document grants control every stored version.
  The system does not retain a separate permission snapshot for each version.

- **A26 - Access list visibility: Assumption.** Any reader can see the document's access summary.
  The PDF does not define who can inspect the list of recipients.

Department membership changes alter access to prior documents.
The PDF does not specify whether access follows current membership or membership at upload time.

## Documents, uploads, and history

Evidence: [document service](../backend/src/services/document.service.ts),
[file rules](../backend/src/utils/file-types.ts),
[upload middleware](../backend/src/middlewares/upload.middleware.ts),
[storage helper](../backend/src/utils/storage.ts),
and [Prisma schema](../backend/prisma/schema.prisma).

- **A27 - Metadata edits: Bonus.** Owners, editors, and admins can change the title,
  description, and tags without a new file version.

- **A28 - Description field: Bonus.** Documents have an optional description.
  The PDF explicitly names title, tags, permissions, and versions.

- **A29 - File policy: Assumption.** Each request accepts one nonempty file of at most 25 MiB.
  The PDF requests type validation but supplies no size or type list.
  The allowed extensions are PDF, PNG, JPG, JPEG, WEBP, DOCX, XLSX, PPTX, TXT, and CSV.

- **A30 - Content checks: Choice.** Binary file signatures must match the extension.
  TXT and CSV files require a UTF-8 sample without NUL bytes.
  The text check reads at most 64 KiB. It is not a full file or malware check.

- **A31 - Metadata limits: Choice.** Titles accept 1-200 characters and descriptions accept 2,000.
  Documents accept ten tags of at most 30 characters each.
  Change notes accept 500 characters. The PDF supplies none of these values.

- **A32 - New-version operation: Assumption.** A separate endpoint and dialog add a version
  to an prior document. The PDF requires history but does not define this flow.

- **A33 - Version numbers: Choice.** Versions start at 1 and increase by one.
  The latest successful upload becomes current.

- **A34 - Concurrent uploads: Choice.** A unique document/version constraint rejects a number
  collision with 409. The client must retry instead of an automatic merge.

- **A35 - Version metadata: Bonus.** History includes the uploader, size, MIME type, original
  filename, SHA-256 checksum, and optional change note.

- **A36 - Shared document metadata: Assumption.** All versions use the same current title,
  description, tags, and permissions. History preserves files, not all past metadata values.

- **A37 - Historical downloads: Bonus.** Readers can preview or download an older version.
  The PDF requires history and document access but does not explicitly require historical downloads.

- **A38 - Format changes: Assumption.** A later version can use a different allowed file type.
  The API does not require the same extension as the first version.

- **A39 - Delete: Bonus.** Owners and admins can delete a document.
  Delete hides all versions from API access but retains the rows and files.

- **A40 - Retention: Assumption.** The application has no restore, purge, expiry, or retention
  period.
  A checksum does not prevent duplicate files or provide a later integrity audit.

- **A41 - Version controls: Assumption.** The application has no approval, rollback, lock,
  version comparison, or per-version delete operation. The PDF requests none of these features.

The PDF requires old history to remain after a new version replaces the current file.
It does not require a new upload to overwrite the old physical file.
Separate files and a current-version pointer meet that interpretation.

## Tags and departments

Evidence: [tag service](../backend/src/services/tag.service.ts),
[department service](../backend/src/services/department.service.ts),
[tag model](../backend/src/models/tag.model.ts),
and [tag input](../frontend/src/components/shared/tag-input.tsx).

- **A42 - Default tag catalog: Bonus.** Admins create default tags and change their active state.
  Tag names cannot change. Deactivation does not remove tags from prior documents.

- **A43 - Free-form tags: Assumption.** Users can enter tag names outside the catalog.
  The catalog supplies suggestions, not a closed vocabulary or foreign-key requirement.

- **A44 - Tag normalization: Choice.** The service removes duplicate names without regard to case.
  Catalog matches use the catalog letter case. Other names retain the supplied letter case.

- **A45 - Deactivated tag behavior: Assumption.** Active-only pickers omit deactivated tags.
  Deactivation does not prohibit the same text through free-form input or direct API input.

- **A46 - Department administration: Bonus.** Admins can create, rename, describe, and delete
  departments. The PDF only requests departments and department restrictions in the data model.

- **A47 - Department deletion: Assumption.** A department with members cannot be deleted.
  Deletion of an empty department removes its grants through the foreign-key cascade.

- **A48 - Catalog uniqueness: Choice.** Tag and department names use case-insensitive uniqueness.
  The PDF does not specify name length limits, descriptions, or duplicate-name rules.

## Search and result behavior

Evidence: [document search](../backend/src/models/document.model.ts),
[search service](../backend/src/services/document.service.ts),
[query schema](../backend/src/validators/document.schema.ts),
and [document filters](../frontend/src/components/documents/document-filters.tsx).

- **A49 - Uploader interpretation: Assumption.** `ownerIds` matches the original document owner.
  It does not match authors of later versions. The interface labels this filter Uploader.

- **A50 - Search scope: Bonus.** Text search covers title, description, current filename,
  owner name, and document tags. It does not search file contents or old filenames.

- **A51 - Fuzzy search: Bonus.** PostgreSQL `ILIKE` and trigram matches accept approximate terms.
  The PDF does not require typo tolerance, a language model, or a search engine.

- **A52 - Relevance: Choice.** An exact title text match receives priority.
  Fuzzy scores use lower weights for description and tags. The PDF specifies no sort formula.

- **A53 - Filter logic: Assumption.** All selected tags must match.
  Any selected owner or file type can match within that filter.
  Different filter groups combine with AND.

- **A54 - Tag case: Assumption.** Catalog letter case normalizes explicit tag filters.
  Array containment remains exact for other names, so free-form tags can differ by case.
  Free-text search uses case-insensitive matches instead.

- **A55 - File type filter: Bonus.** The extension of the current file controls the filter.
  An old version with another extension does not make the document match.

- **A56 - Sort options: Bonus.** Results support relevance, latest version date, title,
  owner, size, and creation date. Search defaults to relevance and other lists to latest version
  date.

- **A57 - Pagination: Choice.** Page numbers use offset pagination.
  The API defaults to 20 results and accepts at most 100 per page.

- **A58 - Search submission: Assumption.** The current document toolbar requires Enter or Search.
  Filter changes apply directly. The URL retains the selected filters, page, and sort order.

- **A59 - Picker behavior: Bonus.** User pickers search users and load additional pages.
  The picker uses 50 users per page and a 300ms search delay.

Example: Alice creates a document, and Bob uploads version 2.
The Uploader filter for Alice finds the document. The same filter for Bob does not find it.
The PDF does not resolve whether this result meets its intended definition of uploader.

## Interface choices

Evidence: [DESIGN.md](../DESIGN.md),
[document preview](../frontend/src/components/documents/document-preview.tsx),
[detail view](../frontend/src/components/documents/document-detail-view.tsx),
and [settings view](../frontend/src/components/settings/settings-view.tsx).

- **A60 - Preview coverage: Assumption.** PDF files use the browser PDF viewer.
  PNG, JPEG, and WEBP files use image previews. Office and text files require a download.
  The PDF does not specify preview formats or a document conversion service.

- **A61 - Upload convenience: Bonus.** The interface supports file drop, a filename-based title,
  upload progress, and a dialog that stays open during the request.

- **A62 - Version selection: Bonus.** A URL parameter selects an old version.
  An alert identifies the old version and links to the latest version.

- **A63 - Settings page: Bonus.** Users can read the Users, Departments, and Tags tabs.
  Admins can use the edit controls. The three required core views do not include Settings.

- **A64 - Visual identity: Choice.** The app uses EEMW Documents as its name,
  a light palette, an ink sidebar, teal accents, Inter, and Space Grotesk.
  The PDF does not mandate this brand, palette, font, or page geometry.

- **A65 - Responsive layout: Choice.** A mobile drawer replaces the desktop sidebar.
  The detail columns become a vertical layout at smaller widths.
  The PDF requests a user-friendly POC but supplies no breakpoint or device specification.

- **A66 - Feedback and keyboard controls: Choice.** The interface includes focus indicators,
  errors, empty states, skeletons, toast messages, and confirmation dialogs.
  These implement usability goals without a detailed acceptance contract in the PDF.

- **A67 - Dates and size labels: Choice.** The API uses UTC dates.
  The browser displays local dates and binary file sizes with KB or MB labels.
  The PDF specifies no locale, time zone, or unit convention.

## Architecture and operations

Evidence: [Compose](../docker-compose.yml),
[cache helper](../backend/src/utils/cache.ts),
[initial migration](../backend/prisma/migrations/20261023014850_init/migration.sql),
[Next.js configuration](../frontend/next.config.ts),
and [seed](../backend/prisma/seed/index.ts).

- **A68 - Stack details: Choice.** Express, Prisma, Zod, Tailwind, Radix, and TanStack
  implement the required layers and views. The PDF does not prescribe these libraries.

- **A69 - Runtime versions: Choice.** Docker uses Node.js 24, PostgreSQL 17, and Redis 7.
  The PDF gives no major version requirements.

- **A70 - Full Docker operation: Explicit optional enhancement.** Compose runs all four services.
  This is the supported local method. The PDF only mandates Compose for the database services.

- **A71 - Redis contract: Explicit optional enhancement with choices.** Compose requires Redis
  at initial start. API cache failures fall back to PostgreSQL after the application starts.
  Document search TTL is one hour. The default TTL for other cached values is three hours.

- **A72 - Cache keys and invalidation: Choice.** Search keys include user IDs.
  Writes increment cache-group counters. Redis reconnection invalidates every group.
  The PDF supplies no freshness or invalidation rules.

- **A73 - Same-origin API: Choice.** Next.js proxies `/api` to Express.
  The browser uses a session cookie instead of a bearer token in local storage.

- **A74 - Storage layout: Choice.** PostgreSQL stores metadata and a named volume stores files.
  The PDF explicitly permits this type of storage but does not specify paths or recovery rules.

- **A75 - Database structure: Choice.** UUIDv7 IDs, UTC timestamps, a tag array, a current-version
  pointer, and one-target grant constraints implement the required relationships.
  The PDF does not require these exact keys or table shapes.

- **A76 - File/database coordination: Choice.** The service moves files inside a database
  transaction.
  It removes moved files after ordinary transaction failures.
  This mechanism is not a distributed transaction or crash recovery system.

- **A77 - Operational endpoints: Bonus.** Swagger UI and a public health endpoint support
  inspection.
  The PDF does not explicitly request either endpoint.

- **A78 - Operational safeguards: Choice.** The API uses request IDs, structured logs, Helmet,
  bounded request sizes, and a ten-second shutdown deadline.
  The PDF requests useful errors and security but does not specify these mechanisms.

- **A79 - Sample data: Bonus.** The destructive seed creates 200 users and sample documents.
  It also supplies two known accounts. The PDF does not require this data or a reset operation.

- **A80 - Client cache: Choice.** TanStack Query uses a 30-second stale time.
  It retries network and server errors twice and disables automatic refetch on window focus.
  The PDF does not define browser data freshness.

## Gaps and decisions with the largest effect

### 1. Search indexes do not cover the full query

Page 2 explicitly requests indexes on search columns.
The migration creates a GIN tag index and user name/email trigram indexes.
It does not create dedicated document title, description, owner ID, or version filename indexes.
The `pg_trgm` extension enables operators, but does not create an index for each column.
This is a concrete assessment concern, not an optional feature request.

Next action: inspect query plans and add the smallest useful indexes for the actual search paths.
No performance measurements in this review establish a scalable search workload.

### 2. Uploader has two possible definitions

The code treats uploader as the original owner.
The version model separately records the user who uploads each version.
Both definitions are plausible from the PDF.

Next action: confirm the intended definition or name the current filter Original uploader.
Do not claim that the current filter finds every contribution by a user.

### 3. Access rules need explicit product acceptance

Public-by-default documents, admin bypass, individual grants, and shared historical access affect
data exposure.
The PDF does not explicitly approve these rules.
The company directory also exposes user details to all users who sign in.

Next action: confirm these rules before a deployment with corporate data.
This review documents the current contract and does not change the access implementation.

### 4. History covers files, not complete document state

The system keeps old file versions, which matches the explicit history requirement.
It does not retain old titles, tags, descriptions, or grants.
Soft deletion retains every file without a recovery interface or purge policy.

Next action: state this boundary in the demonstration and agree on retention before real use.
Do not present this history as an audit trail for all document changes.

### 5. Production readiness remains unverified

The PDF requests a secure, scalable POC, not a full production platform.
Local HTTP cookies, shared demo passwords, and the absent login rate limit limit deployment
readiness.
There is no automated test script, load result, backup procedure, or crash recovery workflow.
This review does not establish a security certification or complete browser pass.

Next action: prioritize access tests, upload failure tests, search measurements, and backup recovery
checks.
Add HTTPS and session controls before a real deployment.

### 6. Swagger through the frontend proxy has a redirect loop

An HTTP check of `http://localhost:3000/api/docs/` failed after repeated redirects.
The README links to the direct backend route, `http://localhost:4000/api/docs/`.
That route did not respond within the ten-second check. Its availability remains unverified.
Swagger is a bonus, so this defect does not remove a required document feature.

Next action: correct the proxy path or Swagger redirect behavior before the demonstration.

### 7. Submission contains tasks outside the code

The README contains the required summary, assumptions, run steps, Node version, and next steps.
The linked architecture document contains the architecture diagram and design choices.
The current DESIGN.md remains an interface guide and now uses the project documentation style.

The review does not confirm GitHub collaborator access, a POC video, or delivery of either link.
Those tasks remain part of the submission checklist on page 3.

## Scope advice

Keep the core demonstration focused on upload, search, department restrictions, history, and
download.
Present account administration, individual editors, deletion, and fuzzy search as bonuses.
Do not remove functional bonuses merely because the PDF does not request them.
Do not add approval workflows, SSO, OCR, notifications, or version comparison to close unspecified
scope.
Resolve the listed assumptions before more product expansion.

## Verification limits

The comparison uses all three PDF pages and the current repository source.
The source shows implementation intent, not complete runtime proof.
The four current Compose services report healthy status.
That status does not prove the correctness of every feature or a new-machine installation.
No seed or data reset forms part of this review.

The backend and frontend lint and type checks passed in Docker build stages.
The login page returned HTTP 200 during the URL check.
