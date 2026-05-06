# Supabase Migration Guideline

This guide defines the standard workflow for schema changes now that runtime data lives in Supabase Postgres.

## Source of truth

- App schema source: `db/schema.ts`
- Generated SQL migrations: `db/migrations/*.sql`
- Supabase auth FK + RLS policies: `db/policies.sql`

## Change workflow

1. Update `db/schema.ts` with the new table/column/index/constraint shape.
2. Generate migration SQL:

```bash
bun run db:generate
```

3. Review the new migration file in `db/migrations/`:
   - verify expected table and column changes
   - verify no unintended drops
   - verify constraints and indexes
4. If ownership/RLS/auth-user references changed, update `db/policies.sql` in the same PR.
5. Run local validation:

```bash
bun ng build
bun ng test --watch=false
```

6. Open Supabase Portal -> SQL Editor.
7. Run the new migration SQL manually.
8. If needed, run `db/policies.sql` (or only the changed policy statements).
9. Verify app behavior in UI (create/update/delete flows for affected entities).

## Practical rules

- Keep schema + repository + model + mapper changes together.
- Do not ship schema-only changes that break runtime contracts.
- Prefer additive migrations when possible (`add column`, backfill, then cleanup).
- Be careful with destructive operations (`drop column`, type narrowing); plan data preservation first.
- Keep `user_id` semantics aligned with RLS (`user_id = auth.uid()`).

## Production safety checklist

Before applying SQL in production:

- Backup is available (or point-in-time recovery is enabled).
- SQL reviewed by at least one other developer.
- A rollback SQL draft exists for high-risk changes.
- Migration is tested in a non-production Supabase project first.

## Rollback strategy

For each migration, prepare a reverse script where practical:

- dropped index -> recreate index
- renamed column -> rename back
- added constraint -> drop constraint if needed

If data shape is destructive, restore from backup may be the safest rollback.

## Example release note entry

- Added `x` column to `projects`
- Updated repository mapper for `projects`
- Applied migration `db/migrations/000N_*.sql`
- Updated `db/policies.sql` for `projects` RLS check
