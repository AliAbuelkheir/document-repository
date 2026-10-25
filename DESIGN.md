# Design: EEMW Documents, direction B ("EEMW command CRM")

Light-only app. The tokens are in `frontend/src/app/globals.css`. Components use tokens, not hex values.

## Color

| Token | Value | Use |
|---|---|---|
| `--sidebar` / `--ink` | `#0F172A` | Sidebar, the only dark surface |
| `--sidebar-accent` | `#1A2744` | Hover and selected items in the sidebar |
| `--sidebar-primary`, `--ring` | `#14B8A6` | Selected mark, icons, focus ring |
| `--background` | `#F8F7F4` | Work area ground |
| `--card`, `--popover` | `#FFFFFF` | Panels, dialogs, menus |
| `--border` | `#E7E5E0` | Hairlines |
| `--input` | `#8F8A82` | Text field borders (3.4:1) |
| `--foreground` | `#0F172A` | Text |
| `--muted-foreground` | `#475569` | Secondary text |
| `--primary` | `#0F766E` | Primary button, links, focus inner line |
| `--selected` | teal at 8% | Row hover, active filters, current badge |
| `--accent` | `#F1EFEA` | Neutral hover |
| `--warning` | `#F59E0B` | Warnings only |
| `--destructive` | `#B91C1C` | Errors and Delete |

## Type

- Inter for all UI text. Space Grotesk 600, -0.02em, 26px for page titles only.
- Tables use 13px text and `tabular-nums` for sizes, dates and counts.

## Shape and depth

- Buttons, filter triggers, select triggers and search fields are pills, 32px high.
- Text fields have an 8px radius. Panels have a 12px radius. Dialogs have a 16px radius.
- Panels have a 1px hairline and a soft 1px shadow. Floating surfaces have a soft drop shadow.

## Layout

- Desktop: a 232px ink sidebar and a scrollable work area with 32px gutters.
- Table pages: one white panel with a toolbar, a table under a sticky header, and pagination at
  the panel foot. Rows are 40px high. Numbers and row actions align right.
- Detail page: preview on the left, a 320px rail with Details and Access, version history below.
- Below 768px: an ink top bar with a menu button. The button opens the sidebar as a drawer.

## Focus

A 2px teal ring with a 1px teal dark inner line. The ink surfaces use a teal outline.
