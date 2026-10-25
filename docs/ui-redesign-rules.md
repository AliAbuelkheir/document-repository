# UI redesign: shared rules

These rules apply to the three UI directions (A, B and C). Each direction has its own git
worktree and branch. The project owner compares the results and selects one direction.
Product facts are in `PRODUCT.md`.

## Scope

- Change only the look and layout of the frontend. Do not change hooks, services, validation
  schemas, API calls or the backend.
- Keep all the current flows: login, documents list, upload, document detail, versions,
  access, Settings.
- Remove dark mode: the `dark` class in `layout.tsx`, the `.dark` tokens and the
  `@custom-variant dark` line in `globals.css`.
- Remove the leaves background: the `background-image` rule in `globals.css` and
  `frontend/public/leaves.svg`.
- Show the product name "EEMW Documents" with the EEMW logo.

## Color

The values come from eemwco.com.

| Role | Value | Use |
|---|---|---|
| Ink | `#0F172A` | Main text, dark surfaces |
| Deep navy | `#1A2744` | Hover and selected items on dark surfaces |
| Slate | `#475569` | Secondary text |
| Slate light | `#94A3B8` | Placeholders and icons only, not body text |
| Paper | `#F8F7F4` | Page or sidebar ground |
| Line | `#E7E5E0` | Borders and dividers |
| White | `#FFFFFF` | Content surfaces |
| Teal | `#14B8A6` | Icons, focus ring, selected marks. Not for text on white |
| Teal dark | `#0F766E` | Accent text, links, primary button fill (white text) |
| Amber | `#F59E0B` | Warnings only |

- Use one accent color (teal) in each view. Color shows state and the main action.
- CAUTION: Do not put text in `#14B8A6` on white. The contrast is 2.5:1 and fails WCAG AA.
  Use `#0F766E` (5.5:1) for text.
- Set these values as the shadcn tokens in `globals.css`. Do not write hex values in
  components.

## Type

- Body and UI text: Inter, through `next/font/google`.
- Use tabular numbers (`tabular-nums`) for sizes, dates and counts.
- Direction B can use Space Grotesk for page titles. Directions A and C use Inter only.

## Quality

- WCAG 2.2 AA contrast. Visible focus ring on all controls.
- Hit areas of 32px or more on desktop.
- The UI must work at 1280px and 1440px wide. Phone width (390px) must work without
  horizontal scroll.
- Fix the defects D1, D2 and D3 in `docs/ui-test-report.md` only if the fix is in UI code.

## Local stack for each worktree

Each worktree runs its own Docker Compose stack on its own ports.

1. Copy `.env` from the main checkout into the worktree root. The file is not in git.
2. In PowerShell, set the ports for the direction:

   | Direction | Project | Frontend | Backend | Postgres | Redis | Studio |
   |---|---|---|---|---|---|---|
   | A | `docrepo-a` | 3001 | 4001 | 5433 | 6380 | 5556 |
   | B | `docrepo-b` | 3002 | 4002 | 5434 | 6381 | 5557 |
   | C | `docrepo-c` | 3003 | 4003 | 5435 | 6382 | 5558 |

   For example, for A:
   `$env:FRONTEND_PORT=3001; $env:BACKEND_PORT=4001; $env:POSTGRES_PORT=5433;`
   `$env:REDIS_PORT=6380; $env:STUDIO_PORT=5556`
3. Start the stack: `docker compose -p docrepo-a up --build -d`.
4. Seed the database: `docker compose -p docrepo-a exec backend npm run db:seed`.

CAUTION: Do not use the default project name `document-repository`. The main checkout uses it,
and the seed deletes all of its data.

## Checks

Run in `frontend/` before you finish:

- `npm run lint`
- `npm run typecheck`

Then examine every screen in a browser at 1440px and 390px wide.

## Finish

- Commit the work on the branch of the direction. Do not merge it into `main`.
- Write `docs/ui-direction-<letter>.md` with screenshots of the documents list, the document
  detail page, a dialog and Settings.
