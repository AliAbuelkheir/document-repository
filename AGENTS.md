# Document Repository

Express + Prisma (PostgreSQL) backend in `backend/`, Next.js frontend in `frontend/`.
Everything runs in Docker Compose; there is no non-Docker setup, so don't add local-only config.

## Formatting

There is no formatter in the project. Write code in this style by hand:

- 2-space indentation, no tabs.
- Lines at most 100 characters.
- Single quotes in TypeScript and JavaScript; double quotes only in JSX attributes and JSON.
- Semicolons at the end of statements.
- Trailing commas in multi-line arrays, objects, parameter lists and imports.
- LF line endings (enforced by `.gitattributes`).
- When a call or literal doesn't fit on one line, put one item per line.

## Conventions

- Follow YAGNI principles, and prefer one-liner solutions.
- File names are kebab-case with a layer suffix: `document.service.ts`, `user.model.ts`.
- Backend layers: routes → controllers → services → models. Only models touch Prisma; controllers never call models.
- Each model function writes only to the tables of its own model (`user.model.ts` also writes
  `user_departments`). It takes an optional last parameter `db: DbClient = prisma`.
  When a service must do several writes together, the service starts the transaction.
  It gives the transaction client to each model function.
- Backend shared helpers live in `backend/src/utils/`.
- JSON is camelCase; dates are ISO-8601 UTC; ids are UUIDv7.
- No `any`: use `unknown` and narrow it.
- Validate all outside input (request bodies, query strings, env vars) with Zod.

## Code style

Write code that a junior developer can read and change without help.

- Write small functions that do one task. Give each function a name that tells what it does.
- Use plain `if` statements and `for` loops when they are clearer than chained or nested expressions.
- Do not use clever tricks, dense one-line expressions, or nested ternaries to make code shorter.
- If a one-liner is hard to read, write it in more lines. Readable code is more important than short code.
- Use clear names for variables. Do not use abbreviations, except common ones such as `id` and `db`.
- Write a short comment above a function only when the name does not tell the full purpose.
- Do not write a comment for each line. Write a comment in the body only to explain a step that is not clear.
- Do not add abstractions, helpers, or options for a possible future need.

## Writing style

Write technical text in Simplified Technical English (ASD-STE100).
This applies to docs, code comments, API error messages, commit messages, and reports.
It does not apply to code, identifiers, commands, file paths, or quoted text.

Verbs:

- Use the active voice. In procedures, use the imperative: "Run the migration."
- Use only the simple tenses and "will" for the future. Write "the seed created", not "the seed has created".
- Use only "can", "must", and "will" as helping verbs. Do not use "should", "would", "may", "might", or "shall".
- Do not use "-ing" forms, except in technical names.

Sentences:

- Procedural sentences: maximum 20 words. Descriptive sentences: maximum 25 words.
- Write one instruction or one topic in each sentence.
- Paragraphs: maximum 6 sentences and one topic.
- Put a comma after a condition that comes before a command: "If the build fails, read the log."
- Do not use contractions or semicolons.
- Keep articles and "that": "make sure that the file exists".
- Use a vertical list for complex text.

Words:

- Use simple, common words and the technical names of the project.
- Use one name for one item. Do not change between names.
- Noun clusters: maximum three words.
- Do not use phrasal verbs ("set up", "carry out") or vague words. Give the specific quantity, name, or action.
- Use American English spelling.

Safety notes: use "WARNING" for a risk to persons and "CAUTION" for a risk of damage, such as data loss.
Start with the command, then give the risk: "CAUTION: Do not run the seed on real data. The seed deletes all tables."

## Checks

Run in `backend/` and `frontend/` before finishing a change:

- `npm run lint`
- `npm run typecheck`
