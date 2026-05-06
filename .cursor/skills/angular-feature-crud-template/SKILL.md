---
name: angular-feature-crud-template
description: Provides strict copy-paste scaffolds for Angular CRUD entity features in this app, including model, VM, mapper, repository, signal store, page UI, shared/components extraction points, and tests. Use when bootstrapping a new entity feature such as projects, orders, invoices, or expenses.
---

# Angular Feature CRUD Template

## Use

Use this skill when creating a new entity feature from scratch and you want ready-to-fill templates matching this repository conventions.

## Target structure

Create under `src/app/features/<entity>/`:

- `models/<entity>.model.ts`
- `models/<entity>.vm.ts`
- `data/<entity>.mapper.ts`
- `data/<entity>s.repository.ts`
- `state/<entity>s.store.ts`
- `ui/<entity>s.page.ts`
- `data/<entity>.mapper.spec.ts`
- `state/<entity>s.store.spec.ts`
- `ui/<entity>s.page.spec.ts`

## 1) Model template

```ts
export interface EntityModel {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface EntityCreateInput {
  name: string;
  isActive?: boolean;
}

export interface EntityUpdateInput {
  name?: string;
  isActive?: boolean;
}
```

## 2) VM template

```ts
import { EntityModel } from './entity.model';

export interface EntityVM extends EntityModel {
  relatedCount: number;
}
```

## 3) Mapper template

```ts
import { EntityCreateInput, EntityModel, EntityUpdateInput } from '../models/entity.model';
import { EntityVM } from '../models/entity.vm';

export interface EntityRecord {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export function toEntityModel(record: EntityRecord): EntityModel {
  return {
    id: record.id,
    name: record.name,
    isActive: record.isActive,
    createdAt: record.createdAt,
  };
}

export function toEntityVM(model: EntityModel, relatedCount: number): EntityVM {
  return { ...model, relatedCount };
}

export function toEntityInsertValues(input: EntityCreateInput) {
  return {
    name: input.name.trim(),
    isActive: input.isActive ?? true,
  };
}

export function toEntityUpdateValues(input: EntityUpdateInput) {
  return {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };
}
```

## 4) Repository template

```ts
import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { EntityCreateInput, EntityUpdateInput } from '../models/entity.model';
import { EntityVM } from '../models/entity.vm';
import { EntityRecord, toEntityInsertValues, toEntityModel, toEntityUpdateValues, toEntityVM } from './entity.mapper';

@Injectable({ providedIn: 'root' })
export class EntitiesRepository {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  async listEntities(): Promise<EntityVM[]> {
    // Query Supabase and map rows to VM
    return [];
  }

  async getEntityById(id: number): Promise<EntityVM | null> {
    void id;
    return null;
  }

  async createEntity(input: EntityCreateInput): Promise<EntityVM> {
    void input;
    throw new Error('Implement createEntity');
  }

  async updateEntity(id: number, input: EntityUpdateInput): Promise<EntityVM | null> {
    void id;
    void input;
    return null;
  }

  async archiveEntity(id: number): Promise<EntityVM | null> {
    void id;
    return null;
  }
}
```

## 5) Signal store template

```ts
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { EntityCreateInput, EntityUpdateInput } from '../models/entity.model';
import { EntityVM } from '../models/entity.vm';
import { EntitiesRepository } from '../data/entities.repository';

type EntitiesState = {
  entities: EntityVM[];
  selectedEntityId: number | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: EntitiesState = {
  entities: [],
  selectedEntityId: null,
  isLoading: false,
  error: null,
};

export const EntitiesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedEntity: computed(
      () => store.entities().find((entity) => entity.id === store.selectedEntityId()) ?? null
    ),
  })),
  withMethods((store, repository = inject(EntitiesRepository)) => ({
    async loadEntities(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const entities = await repository.listEntities();
        patchState(store, { entities, isLoading: false });
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load entities.',
        });
      }
    },
    selectEntity(id: number | null): void {
      patchState(store, { selectedEntityId: id });
    },
    async createEntity(input: EntityCreateInput): Promise<void> {
      void input;
    },
    async updateEntity(id: number, input: EntityUpdateInput): Promise<void> {
      void id;
      void input;
    },
    async archiveEntity(id: number): Promise<void> {
      void id;
    },
  }))
);
```

## 6) Page template (Spartan)

```ts
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { EntitiesStore } from '../state/entities.store';

@Component({
  selector: 'app-entities-page',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmInputImports, HlmSeparatorImports, HlmTableImports],
  template: `<!-- Adapt from clients ui page scaffold in this repo -->`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitiesPage implements OnInit {
  protected readonly store = inject(EntitiesStore);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly isEditing = computed(() => this.selectedId() !== null);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    isActive: [true, [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    await this.store.loadEntities();
  }
}
```

## 7) Specs templates

Mapper spec:

```ts
import { toEntityInsertValues, toEntityUpdateValues, toEntityVM } from './entity.mapper';

describe('entity.mapper', () => {
  it('maps insert values', () => {
    expect(toEntityInsertValues({ name: '  A  ' })).toEqual({ name: 'A', isActive: true });
  });
});
```

Store spec:

```ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EntitiesRepository } from '../data/entities.repository';
import { EntitiesStore } from './entities.store';
```

Page spec:

```ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EntitiesPage } from './entities.page';
import { EntitiesStore } from '../state/entities.store';
```

## Final validation

Run:

```bash
bun ng build
bun ng test --watch=false
```

Also run lints on changed feature files and resolve introduced issues.

## UI decomposition checkpoint

After scaffolding a page, evaluate size and split if needed:

- keep page as container/orchestrator
- extract reusable presentational parts to `src/app/shared/components/`
- keep Spartan wrappers and primitives in `src/app/shared/ui/`

Common extracted components:

- `feature-header-actions`
- `crud-sheet-footer`
- `row-context-menu`
