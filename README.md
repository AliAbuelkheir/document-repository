# Document Repository

A document repository POC with Next.js App Router, an Express API, PostgreSQL, and Redis.
Employees can upload files, search by title, tags, or uploader, and download current or older
versions.

Additional features and assumptions:

- User and department management: admins manage accounts, roles, and department membership.
- Default tags: admins maintain suggested tags, and users can add custom tags.
- Version controls: users with edit access can add change notes. Readers can download older versions.
- Access rules: public documents require login. Each user has at least one department.
  The original uploader owns the document. The Uploader filter matches that owner.

## Run locally

Install Docker with Docker Compose v2 or later.
On Windows, start Docker Desktop with Linux containers.
The containers use Node.js 24. The host does not need Node.js.
Run these commands from the repository root:

1. Create `.env` if the file does not exist:

   ```powershell
   Copy-Item .env.example .env
   ```

   On Linux or macOS, use `cp .env.example .env`.

2. Replace `JWT_SECRET` in `.env` with a random secret of at least 32 characters.
3. Start all services:

   ```sh
   docker compose up --build -d
   ```

4. For a new demonstration database, run the seed:

   CAUTION: Do not run the seed on data that you must keep.
   It deletes all application tables and uploaded files.

   ```sh
   docker compose exec -T backend timeout 120 npm run db:seed
   ```

5. Open [localhost:3000](http://localhost:3000).

Use `admin@docrepo.local` or `user@docrepo.local` with the password `Password123!`.
The backend applies migrations at startup. The seed runs only on request.
Compose is the supported local method for both the backend and frontend.

## Design choice

Next.js proxies API requests to keep the browser on one origin and simplify cookie authentication.

## Documentation

- [Architecture diagram and design choices](docs/architecture.md)
- [Assessment analysis: requirements, assumptions, and bonuses](docs/prd-analysis.md)
- [API documentation](http://localhost:4000/api/docs/)

## Next steps

- Add approval workflows that admins can configure for documents like: 
   procurement contracts, HR offers, HR contracts, and non-disclosure agreements (NDAs).
- Add comments for each document version.
- Read users and department data through the Microsoft Graph API, without changes to the source data.
- Add roles that admins can define, with permissions for each role.
- Allow department owned Documents instead of the current user owned enforcement.
