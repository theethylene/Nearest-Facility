import { createClient } from '@supabase/supabase-js';

// The anon/publishable key is safe to expose client-side by design (Supabase
// docs: https://supabase.com/docs/guides/api/api-keys). It only allows what
// Row Level Security policies permit — see the health_posts RLS policy,
// which grants public read-only access.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://hgbmjzpgihapzkgydven.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_LO1HNNcZok0hA3iMsSWymQ_ijyft7pQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
