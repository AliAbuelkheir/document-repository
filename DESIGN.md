# Interface design: EEMW Documents

This document defines the interface rules for the current application.
The [architecture document](docs/architecture.md) describes the system architecture and database
choices.
The [assessment analysis](docs/prd-analysis.md) separates these choices from assessment
requirements.
The assessment permits a choice of style. It does not specify this visual design.

## Source files

- `frontend/src/app/globals.css` defines the color tokens and base styles.
- `frontend/src/app/layout.tsx` defines the fonts.
- `frontend/src/components/ui/` contains the shared controls.
- `frontend/src/components/shared/` contains the page header, sidebar, search toolbar, and tables.

Use the shared tokens and controls before a new style or component.
Use Tailwind CSS consistently.
Keep interface text in Simplified Technical English.
Do not add a component or option for a possible future need.

## Color

The application uses a light color scheme.
The sidebar, mobile bar, and mobile drawer use the ink surface.
Components use semantic tokens instead of local hex values.

| Token | Value | Purpose |
| --- | --- | --- |
| `--sidebar`, `--ink` | `#0F172A` | Navigation surfaces |
| `--sidebar-accent` | `#1A2744` | Navigation hover and current item |
| `--sidebar-primary`, `--ring` | `#14B8A6` | Current mark, icons, and focus ring |
| `--background` | `#F8F7F4` | Work area |
| `--card`, `--popover` | `#FFFFFF` | Panels, dialogs, and menus |
| `--border` | `#E7E5E0` | Panel and control borders |
| `--input` | `#8F8A82` | Text field borders |
| `--foreground` | `#0F172A` | Main text |
| `--muted-foreground` | `#475569` | Secondary text |
| `--primary` | `#0F766E` | Main actions, links, and inner focus line |
| `--selected` | `rgb(20 184 166 / 0.08)` | Selected items and row hover |
| `--accent` | `#F1EFEA` | Neutral hover |
| `--warning` | `#F59E0B` | Warning accents |
| `--warning-surface` | `#FFFBEB` | Warning background |
| `--destructive` | `#B91C1C` | Errors and delete actions |

Use text or an icon with color to explain an error or selected state.

## Typography

- Use Inter for body text, forms, controls, and tables.
- Use Space Grotesk only for page titles.
- Use 26px, weight 600, and `-0.02em` letter space for page titles.
- Use 13px text for table content.
- Use tabular numerals for sizes, dates, counts, and version numbers.
- Allow long titles to wrap.
- Keep the full value available when a compact cell truncates text.

## Controls and surfaces

| Element | Rule |
| --- | --- |
| Default action button | 32px high with a pill shape |
| Main search field | 40px high with a 6px radius |
| Search button | 40px square with a 6px radius |
| Filter trigger | 32px high with a 6px radius |
| Form text field | 32px high with an 8px radius |
| Panel | 12px radius with a border and a soft shadow |
| Dialog | 16px radius with a shadow |
| Floating menu | Border and a soft shadow |

Use the primary color for an active filter trigger.
Show its selected value or count in the trigger.
Keep destructive actions distinct from the main action.
Use a confirmation dialog before document deletion.

## Layout

At widths of 768px or more, show a 232px sidebar and a separate work area.
Use 32px horizontal space at each side of the work area.
At smaller widths, show a top bar and a menu button.
The menu button opens a drawer from the left.
Use 16px horizontal space at each side of the mobile work area.

List pages use one white panel with a search toolbar, table, and pagination controls.
Keep the table header visible when the table scrolls.
Align numeric columns and row actions to the right.
Allow the toolbar and page actions to wrap at narrow widths.

At widths of 1024px or more, place the document preview beside a 320px details column.
Place the Details and Access panels in that column.
At smaller widths, place those panels below the preview.
Place version history below the preview and details area.

## Interaction rules

- Submit the document search with Enter or the Search button.
- Apply a document filter when the user changes its selected values.
- Keep document filters, sort order, page, and selected version in the URL.
- Explain that tags use AND and that uploader and file type choices use OR.
- Show the current version by default.
- Show an alert and a link to the latest version for an older selected version.
- Show a download action when inline preview is unavailable.
- Keep the upload dialog open while the upload request is active.
- Show progress, field errors, empty results, and request failures near the related control or
  content.
- Show view, edit, and manage actions with the access flags from the API.
- Confirm removal of viewer grants before a document becomes public.

The API must enforce every access rule even when the interface hides an action.
Public means all users who sign in.
The Uploader filter currently selects document owners.

## Keyboard and focus

Give each input a label and each icon button an accessible name.
Use native controls and the Radix components for keyboard interaction.
Keep a visible focus indicator on every control.
Use the teal ring with a dark teal inner line on light surfaces.
Use the sidebar ring token on ink surfaces.
Use a visible fill for menu items and options with keyboard focus.

Do not claim accessibility compliance from these rules alone.
Use browser and assistive technology checks to verify the interface.
