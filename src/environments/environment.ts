/**
 * Production environment values.
 *
 * NOTE: `supabaseAnonKey` is the public anon key from the Supabase dashboard.
 * It is safe to ship in the browser bundle - Row-Level Security policies
 * (see db/policies.sql) are the actual security boundary, not key secrecy.
 * The service role key must NEVER appear in this file.
 */
export const environment = {
  production: true,
  supabaseUrl: 'https://cphhrtozpetwfjysjhft.supabase.co',
  supabaseAnonKey: 'sb_publishable_dr5h7KDpSupdHdf0eUw7gg__iZwaeki',
};
