/**
 * Minimal in-memory fake for `@supabase/supabase-js` covering only the
 * operations exercised by this app's repositories. Not a full PostgREST
 * implementation; it is intentionally permissive so tests stay focused on
 * repository logic instead of the wire protocol.
 */

import { SupabaseClient } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

export type FakeTables = Record<string, Row[]>;

export interface FakeAuthState {
  userId: string;
  email?: string;
  session?: unknown;
}

interface SelectAlias {
  alias: string;
  source: string;
}

interface QueryState {
  op: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
  table: string;
  filters: Array<(row: Row) => boolean>;
  ordering: Array<{ column: string; ascending: boolean }>;
  selectAliases: SelectAlias[] | null;
  selectOptions: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean } | null;
  payload: Row | Row[] | null;
  upsertConflict: string | null;
  finalize: 'single' | 'maybeSingle' | null;
  limitCount: number | null;
}

interface QueryResult<T = unknown> {
  data: T;
  error: { message: string; code?: string } | null;
  count?: number;
}

class FakeQuery<T = unknown> implements PromiseLike<QueryResult<T>> {
  constructor(
    private readonly client: FakeSupabaseClient,
    private readonly state: QueryState,
  ) {}

  select(columns?: string, options?: QueryState['selectOptions']): FakeQuery<T> {
    const next: QueryState = {
      ...this.state,
      selectAliases: columns ? parseSelectColumns(columns) : null,
      selectOptions: options ?? null,
    };
    if (this.state.op !== 'select') {
      // chained .select after insert/update/upsert: keep the original op.
      return new FakeQuery<T>(this.client, next);
    }
    return new FakeQuery<T>(this.client, next);
  }

  eq(column: string, value: unknown): FakeQuery<T> {
    return this.addFilter((row) => row[column] === value);
  }

  gte(column: string, value: unknown): FakeQuery<T> {
    return this.addFilter((row) => (row[column] as never) >= (value as never));
  }

  lte(column: string, value: unknown): FakeQuery<T> {
    return this.addFilter((row) => (row[column] as never) <= (value as never));
  }

  lt(column: string, value: unknown): FakeQuery<T> {
    return this.addFilter((row) => (row[column] as never) < (value as never));
  }

  not(column: string, operator: 'is', value: unknown): FakeQuery<T> {
    if (operator === 'is' && value === null) {
      return this.addFilter((row) => row[column] !== null && row[column] !== undefined);
    }
    return this;
  }

  like(column: string, pattern: string): FakeQuery<T> {
    const prefix = pattern.endsWith('%') ? pattern.slice(0, -1) : pattern;
    return this.addFilter((row) => String(row[column] ?? '').startsWith(prefix));
  }

  or(filter: string): FakeQuery<T> {
    return this.addFilter(parseOrFilter(filter));
  }

  limit(count: number): FakeQuery<T> {
    return new FakeQuery<T>(this.client, { ...this.state, limitCount: count });
  }

  order(column: string, options?: { ascending?: boolean }): FakeQuery<T> {
    const ascending = options?.ascending !== false;
    return new FakeQuery<T>(this.client, {
      ...this.state,
      ordering: [...this.state.ordering, { column, ascending }],
    });
  }

  returns<U>(): FakeQuery<U> {
    return new FakeQuery<U>(this.client, this.state);
  }

  single<U = T>(): FakeQuery<U> {
    return new FakeQuery<U>(this.client, { ...this.state, finalize: 'single' });
  }

  maybeSingle<U = T>(): FakeQuery<U> {
    return new FakeQuery<U>(this.client, { ...this.state, finalize: 'maybeSingle' });
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    try {
      const result = this.client.executeQuery<T>(this.state);
      return Promise.resolve(result).then(onfulfilled, onrejected);
    } catch (error) {
      return Promise.reject(error).catch(onrejected);
    }
  }

  private addFilter(predicate: (row: Row) => boolean): FakeQuery<T> {
    return new FakeQuery<T>(this.client, {
      ...this.state,
      filters: [...this.state.filters, predicate],
    });
  }
}

function parseOrFilter(filter: string): (row: Row) => boolean {
  const parts = splitTopLevelOrParts(filter);
  const predicates = parts.map(parseOrPart);
  return (row) => predicates.some((predicate) => predicate(row));
}

function splitTopLevelOrParts(filter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of filter) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.length > 0) {
    parts.push(current);
  }
  return parts;
}

function parseOrPart(part: string): (row: Row) => boolean {
  const trimmed = part.trim();
  if (trimmed.startsWith('and(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(4, -1);
    const conditions = splitTopLevelOrParts(inner).map(parseSimpleCondition);
    return (row) => conditions.every((condition) => condition(row));
  }
  return parseSimpleCondition(trimmed);
}

function parseSimpleCondition(part: string): (row: Row) => boolean {
  const likeMatch = part.match(/^([^.]+)\.like\.(.+)$/);
  if (likeMatch) {
    const [, column, pattern] = likeMatch;
    const prefix = pattern.endsWith('%') ? pattern.slice(0, -1) : pattern;
    return (row) => String(row[column] ?? '').startsWith(prefix);
  }

  const eqMatch = part.match(/^([^.]+)\.eq\.(.+)$/);
  if (eqMatch) {
    const [, column, value] = eqMatch;
    const parsed = Number.isNaN(Number(value)) ? value : Number(value);
    return (row) => row[column] === parsed;
  }

  const ltMatch = part.match(/^([^.]+)\.lt\.(.+)$/);
  if (ltMatch) {
    const [, column, value] = ltMatch;
    return (row) => (row[column] as never) < (value as never);
  }

  return () => true;
}

function parseSelectColumns(columns: string): SelectAlias[] {
  return columns
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => {
      if (part === '*') {
        return { alias: '*', source: '*' };
      }
      const [aliasOrSource, source] = part.split(':').map((segment) => segment.trim());
      if (source) {
        return { alias: aliasOrSource, source };
      }
      return { alias: aliasOrSource, source: aliasOrSource };
    });
}

function applyAliases(row: Row, aliases: SelectAlias[] | null): Row {
  if (!aliases) {
    return { ...row };
  }
  if (aliases.length === 1 && aliases[0].alias === '*') {
    return { ...row };
  }
  const projected: Row = {};
  for (const { alias, source } of aliases) {
    projected[alias] = source in row ? row[source] : null;
  }
  return projected;
}

export class FakeSupabaseClient {
  private nextIdByTable = new Map<string, number>();
  private listeners = new Set<(event: string, session: unknown) => void>();

  constructor(public tables: FakeTables, public auth_: FakeAuthState) {}

  from(table: string) {
    const initial: QueryState = {
      op: 'select',
      table,
      filters: [],
      ordering: [],
      selectAliases: null,
      selectOptions: null,
      payload: null,
      upsertConflict: null,
      finalize: null,
      limitCount: null,
    };
    return {
      select: (columns?: string, options?: QueryState['selectOptions']) =>
        new FakeQuery(this, {
          ...initial,
          selectAliases: columns ? parseSelectColumns(columns) : null,
          selectOptions: options ?? null,
        }),
      insert: (payload: Row | Row[]) =>
        new FakeQuery(this, { ...initial, op: 'insert', payload }),
      update: (payload: Row) =>
        new FakeQuery(this, { ...initial, op: 'update', payload }),
      upsert: (payload: Row | Row[], options?: { onConflict?: string }) =>
        new FakeQuery(this, {
          ...initial,
          op: 'upsert',
          payload,
          upsertConflict: options?.onConflict ?? null,
        }),
      delete: () => new FakeQuery(this, { ...initial, op: 'delete' }),
    };
  }

  readonly auth = {
    getUser: async () => ({
      data: { user: { id: this.auth_.userId, email: this.auth_.email } },
      error: null,
    }),
    getSession: async () => ({ data: { session: this.auth_.session ?? null }, error: null }),
    signInWithPassword: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (
      callback: (event: string, session: unknown) => void,
    ): { data: { subscription: { unsubscribe: () => void } } } => {
      this.listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners.delete(callback);
            },
          },
        },
      };
    },
  };

  asSupabaseClient(): SupabaseClient {
    return this as unknown as SupabaseClient;
  }

  executeQuery<T>(state: QueryState): QueryResult<T> {
    const rows = this.tables[state.table] ?? [];
    const matches = (row: Row) => state.filters.every((predicate) => predicate(row));

    switch (state.op) {
      case 'select': {
        const filtered = rows.filter(matches);
        const sorted = sortRows(filtered, state.ordering);
        const limited =
          state.limitCount === null ? sorted : sorted.slice(0, state.limitCount);
        const count =
          state.selectOptions?.count === 'exact' ||
          state.selectOptions?.count === 'planned' ||
          state.selectOptions?.count === 'estimated'
            ? sorted.length
            : undefined;
        const data = state.selectOptions?.head
          ? null
          : limited.map((row) => applyAliases(row, state.selectAliases));
        return finalizeResult<T>(state, data, null, count);
      }

      case 'insert': {
        const inserted = this.insertRows(state.table, toRowArray(state.payload));
        const data = state.selectAliases
          ? inserted.map((row) => applyAliases(row, state.selectAliases))
          : inserted.map((row) => ({ ...row }));
        return finalizeResult<T>(state, data, null);
      }

      case 'update': {
        const targets = rows.filter(matches);
        for (const target of targets) {
          Object.assign(target, state.payload);
        }
        const data = state.selectAliases
          ? targets.map((row) => applyAliases(row, state.selectAliases))
          : targets.map((row) => ({ ...row }));
        return finalizeResult<T>(state, data, null);
      }

      case 'upsert': {
        const conflict = state.upsertConflict;
        const incoming = toRowArray(state.payload);
        const updated: Row[] = [];
        const toInsert: Row[] = [];
        for (const next of incoming) {
          if (conflict) {
            const existing = rows.find((row) => row[conflict] === next[conflict]);
            if (existing) {
              Object.assign(existing, next);
              updated.push(existing);
              continue;
            }
          }
          toInsert.push(next);
        }
        const inserted = this.insertRows(state.table, toInsert);
        const all = [...updated, ...inserted];
        const data = state.selectAliases
          ? all.map((row) => applyAliases(row, state.selectAliases))
          : all.map((row) => ({ ...row }));
        return finalizeResult<T>(state, data, null);
      }

      case 'delete': {
        const remaining = rows.filter((row) => !matches(row));
        this.tables[state.table] = remaining;
        const removed = rows.length - remaining.length;
        return finalizeResult<T>(state, [] as unknown, null, removed);
      }
    }
  }

  private insertRows(table: string, rowsIn: Row[]): Row[] {
    const target = this.tables[table] ?? (this.tables[table] = []);
    const inserted: Row[] = [];
    for (const incoming of rowsIn) {
      const row: Row = { ...incoming };
      if (!('id' in row) && table !== 'settings') {
        const next = (this.nextIdByTable.get(table) ?? maxId(target)) + 1;
        this.nextIdByTable.set(table, next);
        row['id'] = next;
      }
      if (!('created_at' in row)) {
        row['created_at'] = new Date().toISOString();
      }
      target.push(row);
      inserted.push(row);
    }
    return inserted;
  }
}

function toRowArray(value: Row | Row[] | null): Row[] {
  if (value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function maxId(rows: Row[]): number {
  let max = 0;
  for (const row of rows) {
    const id = typeof row['id'] === 'number' ? row['id'] : 0;
    if (id > max) max = id;
  }
  return max;
}

function sortRows(rows: Row[], ordering: QueryState['ordering']): Row[] {
  if (ordering.length === 0) return [...rows];
  const sorted = [...rows];
  sorted.sort((a, b) => {
    for (const { column, ascending } of ordering) {
      const left = a[column];
      const right = b[column];
      if (left === right) continue;
      if (left === null || left === undefined) return ascending ? -1 : 1;
      if (right === null || right === undefined) return ascending ? 1 : -1;
      if ((left as never) < (right as never)) return ascending ? -1 : 1;
      if ((left as never) > (right as never)) return ascending ? 1 : -1;
    }
    return 0;
  });
  return sorted;
}

function finalizeResult<T>(
  state: QueryState,
  data: unknown,
  error: QueryResult['error'],
  count?: number,
): QueryResult<T> {
  if (state.finalize === 'single') {
    if (Array.isArray(data) && data.length > 0) {
      return { data: data[0] as T, error, count };
    }
    return {
      data: null as unknown as T,
      error: error ?? { message: 'No rows found', code: 'PGRST116' },
      count,
    };
  }
  if (state.finalize === 'maybeSingle') {
    if (Array.isArray(data) && data.length > 0) {
      return { data: data[0] as T, error, count };
    }
    return { data: null as unknown as T, error, count };
  }
  return { data: data as T, error, count };
}

export function createFakeSupabase(
  tables: FakeTables = {},
  auth: FakeAuthState = { userId: '00000000-0000-0000-0000-000000000001' },
): FakeSupabaseClient {
  return new FakeSupabaseClient(tables, auth);
}
