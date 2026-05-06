# Agent Conventions

This repository uses persistent Cursor rules and skills for implementation consistency.

## Start here

- Rule overview: [.cursor/rules/README.md](.cursor/rules/README.md)
- Skill files: `.cursor/skills/`

## Core expectations

- Angular + Tailwind + Spartan UI stack defaults
- Signal Store for feature state
- Supabase (Auth + Postgres + RLS) for runtime persistence
- Drizzle ORM + migrations for schema changes
- Feature layering (`models/data/state/ui`)
- Shared boundary:
  - `src/app/shared/ui/` for Spartan wrappers
  - `src/app/shared/components/` for app-level reusable components

## Data/persistence expectations

- Repositories are the only persistence boundary for feature data.
- Favor `@supabase/supabase-js` in repositories via `SUPABASE_CLIENT`.
- Keep `user_id` ownership semantics aligned with RLS policies in `db/policies.sql`.
- When changing data shape, update Drizzle schema/migration and companion RLS/auth FK SQL together.

## Validation

For substantive changes, validate with:

- `bun ng build`
- `bun ng test --watch=false`
