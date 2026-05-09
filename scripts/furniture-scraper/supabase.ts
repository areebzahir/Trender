/**
 * Supabase admin client for the furniture scraper.
 * Backend/script use only — uses service role key.
 * NEVER import this from frontend code.
 */
import { createClient } from '@supabase/supabase-js';
import { config, validateSupabaseConfig } from './config';

validateSupabaseConfig();

export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
