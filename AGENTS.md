# Agent Conventions

This repository uses persistent Cursor rules and skills for implementation consistency.

## Start here

- Rule overview: [.cursor/rules/README.md](.cursor/rules/README.md)
- Skill files: `.cursor/skills/`

## Core expectations

- Angular + Tailwind + Spartan UI stack defaults
- Signal Store for feature state
- Drizzle ORM + migrations for schema changes
- Feature layering (`models/data/state/ui`)
- Shared boundary:
  - `src/app/shared/ui/` for Spartan wrappers
  - `src/app/shared/components/` for app-level reusable components

## Validation

For substantive changes, validate with:

- `bun ng build`
- `bun ng test --watch=false`
