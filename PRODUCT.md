# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Staff of EEMW, an Egyptian digital transformation company. Each user is in one or more
  departments.
- Two roles: `ADMIN` and `USER`. Admins also manage users, departments and tags in Settings.
- The users work on a laptop or desktop at a desk. They upload, find, read and share work
  documents many times each day.
- The project owner reviews the UI and selects one design. The project is a technical
  assessment for EEMW.

## Product Purpose

EEMW Documents keeps the documents of the company in one place. Users upload files, find them
with search and filters, read them in the browser, and control who can see or edit them.
Success: a user finds the correct document and its latest version in a few seconds.

## Positioning

The product is an internal tool for EEMW, not a public product. It must look like a part of the
EEMW brand, with the calm and simple feel of an Apple app or a modern CRM.

## Operating Context

- Documents list: search, tag and uploader filters, sort, pagination.
- Upload dialog: file, title, description, tags, access.
- Document detail: PDF and image preview, download, version history, new version, edit,
  access (visibility, viewers, editors), delete.
- Settings: users, departments and tags tabs (admins only).
- Login with email and password.

## Capabilities and Constraints

- Next.js App Router, Tailwind v4, shadcn/ui (Radix), lucide icons, TanStack Query and Table,
  react-hook-form and Zod.
- Everything runs in Docker Compose. There is no local-only setup.
- A UI change must not change the data hooks, services, validation or API calls.
- Versions cannot be deleted: there is no API endpoint for it.
- Comments and version restore are out of scope.

## Brand Commitments

- Product name: "EEMW Documents". Use the EEMW logo (`frontend/src/app/icon.png`).
- Light mode only. Remove dark mode.
- Very simple design, similar to Apple apps and CRM systems.
- Use the EEMW color scheme from eemwco.com. The shared rules are in
  `docs/ui-redesign-rules.md`.
- Remove the current leaves background image.

## Evidence on Hand

- EEMW logo: `frontend/src/app/icon.png`.
- Seed data and sample files: `backend/prisma/seed/`.
- No customer quotes, statistics or other claims exist. Do not invent them.

## Product Principles

1. Find first: search and the documents list are the center of the product.
2. Show access clearly: a user always knows who can see and who can edit a document.
3. Calm and quiet: color shows state and the main action, not decoration.
4. One design for all screens: the same rules on the list, the detail page and Settings.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast for text and controls.
- Full keyboard use with a visible focus ring. The focus goes back to the trigger after a dialog
  closes.
- The UI must work on desktop first. Phone layouts must work but are not the focus.
