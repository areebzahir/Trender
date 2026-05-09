/**
 * Supabase ADMIN client — BACKEND / EDGE FUNCTIONS ONLY
 *
 * This file uses the service role key.
 * It must NEVER be imported by any frontend component or page.
 * It is only used by:
 *   - Supabase Edge Functions (Deno runtime)
 *   - Server-side ingestion scripts
 *
 * In Edge Functions, keys come from Deno.env.get(), not import.meta.env.
 * In Node scripts, keys come from process.env.
 */

// Detect runtime: Deno (Edge Functions) vs Node
const getEnv = (key: string): string => {
  // @ts-ignore — Deno global exists in Edge Function runtime
  if (typeof Deno !== 'undefined') return Deno.env.get(key) ?? '';
  return process.env[key] ?? '';
};

const supabaseUrl         = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const serviceRoleKey      = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!serviceRoleKey) {
  throw new Error(
    '❌ SUPABASE_SERVICE_ROLE_KEY is not set. ' +
    'This client must only run server-side. Never expose the service role key to the browser.'
  );
}

// Dynamic import so this file can be tree-shaken from frontend bundles
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
