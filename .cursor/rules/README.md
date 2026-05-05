# Cursor Rules Overview

This folder contains project rules that shape agent behavior for this repository.

## Rules

- `angular-feature-architecture.mdc`
  - Defines feature layering (`models`, `data`, `state`, `ui`) and keeps page components as orchestration containers.
- `shared-ui-boundary.mdc`
  - Reserves `src/app/shared/ui/` for Spartan wrappers/primitives and `src/app/shared/components/` for app-level reusable UI.
- `subagent-usage.mdc`
  - Explains when subagents are appropriate (broad, parallel exploration) versus direct edits.
- `tech-stack-ui-conventions.mdc`
  - Enforces Angular + Tailwind + Spartan UI defaults and discourages plain CSS/custom HTML controls when existing Spartan components are available.
  - Includes a future-looking note to re-evaluate Angular Signal Forms during upgrades.
- `testing-quality-gate.mdc`
  - Defines testing baseline and requires build/test validation for substantive edits.
- `drizzle-migration-discipline.mdc`
  - Keeps Drizzle schema, migrations, and feature contracts synchronized.
- `ui-interaction-consistency.mdc`
  - Locks in sheet/context-menu/toast behavior and shared interaction consistency.

## Why this exists

- Keep behavior consistent across sessions.
- Reduce re-explaining project conventions in every new chat.
- Prevent stack drift (e.g., plain CSS instead of Tailwind utilities, non-Spartan controls).

## Maintenance

- Keep rules concise and practical.
- Update these rules when architecture or design conventions change.
