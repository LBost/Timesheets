import { InjectionToken, Provider } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');

export function provideSupabase(): Provider {
  return {
    provide: SUPABASE_CLIENT,
    useFactory: () => {
      if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
        throw new Error(
          'Supabase URL or anon key is missing. Populate src/environments/environment*.ts.'
        );
      }
      return createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    },
  };
}

/**
 * Returns the currently signed-in user id. Throws if no session is active so
 * repositories surface a clear error instead of silently inserting NULL into
 * `user_id` columns (which RLS would reject anyway).
 */
export async function requireCurrentUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('You must be signed in to perform this action.');
  }
  return userId;
}
