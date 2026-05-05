---
name: angular-feature-crud-pattern
description: Implements a consistent CRUD feature pattern for this Angular app using models/data/state/ui subfolders, signal store, repository abstraction, Spartan UI components, shared/components extraction, and feature tests. Use when creating or refactoring entity features such as clients, projects, and orders.
---

# Angular Feature CRUD Pattern

## Purpose

Use this skill to implement CRUD for a feature entity with the same structure and conventions used for the `clients` feature.

## Required structure

For a feature at `src/app/features/<entity>/`, use:

- `models/`
  - `<entity>.model.ts`
  - `<entity>.vm.ts`
- `data/`
  - `<entity>.mapper.ts`
  - `<entity>.repository.ts`
  - mapper/repository specs
- `state/`
  - `<entity>s.store.ts`
  - store spec
- `ui/`
  - `<entity>s.page.ts`
  - page spec

Keep the feature root free of leaf files when possible.

## Implementation workflow

Copy this checklist and track progress:

```md
Feature CRUD Progress:
- [ ] Define model + VM + create/update input types
- [ ] Implement mapper functions for normalization and VM shaping
- [ ] Implement repository CRUD methods
- [ ] Implement signal store state/computed/methods
- [ ] Build page UI with Spartan wrappers
- [ ] Add tests for mapper/store/page
- [ ] Run build + tests + lints
```

## Contracts

Create:

- `<Entity>Model`: persisted/read shape
- `<Entity>CreateInput`: create payload
- `<Entity>UpdateInput`: update payload (partial)
- `<Entity>VM extends <Entity>Model`: includes derived fields only (counts, labels)

Do not put derived fields in persisted models.

## Mapper rules

In `<entity>.mapper.ts`:

- Normalize optional text (`trim`, empty -> `null`)
- Map record -> model
- Map model + derived values -> VM
- Build insert/update payload helpers

Keep all normalization logic centralized in mapper helpers.

## Repository rules

In `<entity>.repository.ts`:

- Expose:
  - `list...()`
  - `get...ById(id)`
  - `create...(input)`
  - `update...(id, input)`
  - `archive...(id)` (soft delete via `isActive=false`) when relevant
- Enforce business guardrails (uniqueness, active-child constraints)
- Return VM-level data to callers

The page should never access persistence directly.

## Store rules

In `<entity>s.store.ts`, use `signalStore` with:

- State:
  - `items`
  - `selected...Id`
  - `isLoading`
  - `error`
- Computed:
  - `selected...`
- Methods:
  - `load...`
  - `create...`
  - `update...`
  - `archive...` (if supported)
  - `select...`

Set loading/error around async calls and keep mutation logic in the store.

## UI rules (Spartan + componentization)

In `<entity>s.page.ts`:

- Use Spartan wrappers already available in this project:
  - `@spartan-ng/helm/button`
  - `@spartan-ng/helm/input`
  - `@spartan-ng/helm/separator`
  - `@spartan-ng/helm/skeleton`
  - `@spartan-ng/helm/table` when tabular
- Use reactive forms with validators
- Show loading and error states
- Keep page declarative; call store methods for actions
- Keep page files as orchestration containers, and extract reusable presentational UI into components.

Prefer existing local wrappers in `src/app/shared/ui/*`.
Place app-level reusable view components in `src/app/shared/components/*`.

### Shared folder boundary

- `src/app/shared/ui/` is reserved for Spartan wrappers/primitives.
- `src/app/shared/components/` is reserved for app-level presentational components.

### Recommended extraction order

When a page gets large, extract in this order:
1. shared presentational primitives (header action, sheet footer, row context menu)
2. feature-local sheet/table components
3. cross-feature generic variants only when duplication is proven

## Testing baseline

At minimum:

- Mapper spec:
  - normalization behavior
  - update payload behavior
  - VM mapping behavior
- Store spec:
  - load success
  - create success
  - error path (example: archive guardrail)
- Page spec:
  - component creation
  - init load call
  - valid form submit triggers create/update

## Validation commands

Run:

```bash
bun ng build
bun ng test --watch=false
```

Use lints for changed files and fix introduced issues.

## Routing update

If page location changes, update feature route import in `src/app/app.routes.ts` to the `ui/` path.
