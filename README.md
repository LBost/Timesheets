# Timesheets

Angular timesheet application using:

- Angular 21 (standalone components + reactive forms)
- Tailwind + Spartan UI wrappers
- Signal Store (`@ngrx/signals`)
- Supabase (Auth + Postgres + RLS) for runtime persistence
- Drizzle (`db/schema.ts`) for schema/migration authoring

## Backend setup (Supabase)

1. Create a Supabase project.
2. Set values in:
   - `src/environments/environment.development.ts`
   - `src/environments/environment.ts`
3. Apply SQL in this order:
   - `db/migrations/0000_concerned_talkback.sql`
   - `db/policies.sql`
4. In Supabase Auth, create the single user account used by this app.

Notes:

- The Supabase anon key is expected in the browser environment files.
- Security is enforced by RLS policies (`user_id = auth.uid()`), not by hiding the anon key.

## Supabase quickstart (copy/paste)

Run these statements in the Supabase SQL Editor for first-time setup:

1. Open migration SQL and copy all contents:
   - `db/migrations/0000_concerned_talkback.sql`
2. Paste into Supabase SQL Editor and run.
3. Open policy SQL and copy all contents:
   - `db/policies.sql`
4. Paste into Supabase SQL Editor and run.

Then create a user in Supabase Auth and sign in from the app.

## Development server

```bash
bun ng serve
```

Open `http://localhost:4200/`.

## Build

```bash
bun ng build
```

## Tests

```bash
bun ng test --watch=false
```

## Migrations

When persisted shape changes:

1. Update `db/schema.ts`
2. Generate migration:

```bash
bun run db:generate
```

3. Keep RLS/auth FK changes in `db/policies.sql` when needed.
4. Apply generated SQL in Supabase SQL Editor.

For a full step-by-step workflow (including safety checks and rollback strategy), see:

- `docs/supabase-migration-guideline.md`
