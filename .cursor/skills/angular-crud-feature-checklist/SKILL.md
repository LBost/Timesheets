---
name: angular-crud-feature-checklist
description: Checklist-driven workflow for adding or refactoring CRUD features in this Angular app. Use when creating a new entity or restructuring an existing feature.
---

# Angular CRUD Feature Checklist

Use this checklist to keep feature work consistent and merge-ready.

## Checklist

```md
CRUD Feature Progress:
- [ ] Confirm entity contracts (model/create/update/vm)
- [ ] Align Drizzle schema + migration and update Supabase companion SQL (`db/policies.sql`) if data shape changed
- [ ] Implement or update mapper normalization and payload helpers
- [ ] Implement or update repository CRUD and guardrails
- [ ] Implement or update signal store state/computed/methods
- [ ] Implement or update page/container orchestration
- [ ] Extract reusable presentational UI to shared/components when repeated
- [ ] Add or update mapper/store/page/component tests
- [ ] Run build + tests
```

## Guardrails

- Keep page files as orchestration containers.
- Keep persistence access in repositories.
- Use Supabase client (`SUPABASE_CLIENT`) in repositories for runtime data access.
- Reuse Spartan wrappers from `src/app/shared/ui/`.
- Place app-level reusable view components in `src/app/shared/components/`.

## Validation commands

```bash
bun ng build
bun ng test --watch=false
```
