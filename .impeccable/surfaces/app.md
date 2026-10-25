# Surface: EEMW Documents app (direction B, "EEMW command CRM")

Mode: Operate. Build path: code-led. The project owner pinned the visual direction, so the
direction round (concept-seed and decision page) did not run.

Scope: login, documents list, upload dialog, document detail (preview, versions, access),
Settings tabs (users, departments, tags). Light-only app.

## Direction contract

THESIS: A command console for company documents. An ink rail holds the brand and navigation,
and a paper work area holds dense, quiet records. It refuses the generic top-bar SaaS page
with floating cards.

OWN-WORLD: Ink `#0F172A` rail (the only dark surface), deep navy `#1A2744` hover and selected
rows, a 3px teal `#14B8A6` mark on the selected item. Paper `#F8F7F4` ground, white panels with
`#E7E5E0` hairlines, 12px panel radius. Pill buttons and triggers; teal dark `#0F766E` primary.
Space Grotesk page titles; Inter for everything else; tabular numbers in data.

STORY: The user sees all documents in one sticky-header table, filters it in one toolbar,
opens a record, and reads who can see and edit it beside the preview.

FIRST VIEWPORT: Rail left (232px). Work area: title "Documents" with result count and the
Upload pill at the top right. Under it, one white panel: toolbar (pill search, Tags, Uploader),
then the compact table filling the viewport height, pagination fixed at the panel foot.

FORM: CRM record console. Signature interaction: the table scrolls inside its panel under a
sticky header, so the toolbar and the pagination stay in view. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance
