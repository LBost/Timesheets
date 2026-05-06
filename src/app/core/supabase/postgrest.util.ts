import { PostgrestError } from '@supabase/supabase-js';

/**
 * Postgres unique-violation SQLSTATE code, surfaced by Supabase as
 * `error.code === '23505'`.
 */
export const UNIQUE_VIOLATION_CODE = '23505';

export function isUniqueViolation(error: PostgrestError | null): boolean {
  return error?.code === UNIQUE_VIOLATION_CODE;
}

export function throwIfError(error: PostgrestError | null, fallback: string): void {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
