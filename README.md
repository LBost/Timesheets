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
   - `db/migrations/0001_steady_preak.sql`
   - `db/policies.sql`
4. In Supabase Auth, create the single user account used by this app.

Notes:

- The Supabase anon key is expected in the browser environment files.
- Security is enforced by RLS policies (`user_id = auth.uid()`), not by hiding the anon key.

## Supabase quickstart (copy/paste)

Run these statements in the Supabase SQL Editor for first-time setup:

1. Open migration SQL and copy all contents:
   - `db/migrations/0000_concerned_talkback.sql`
2. Open next migration SQL and copy all contents:
   - `db/migrations/0001_steady_preak.sql`
3. Paste migration SQL into Supabase SQL Editor and run (first `0000`, then `0001`).
4. Open policy SQL and copy all contents:
   - `db/policies.sql`
5. Paste into Supabase SQL Editor and run.

Then create a user in Supabase Auth and sign in from the app.

## Schema update for existing projects

If your Supabase project already has `0000` applied, you only need to sync the new invoice changes:

1. In Supabase SQL Editor, run:
   - `db/migrations/0001_steady_preak.sql`
2. Run:
   - `db/policies.sql`
3. Verify new tables/columns exist:
   - `invoices`
   - `invoice_line_items`
   - `tax_rates`
   - `time_entries.locked_by_invoice_id`
   - `time_entries.locked_at`
4. Restart app and test flows:
   - invoice generation (`concept`/`proforma`)
   - status move to `open` locks linked time entries
   - locked time entries cannot be edited/deleted

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
