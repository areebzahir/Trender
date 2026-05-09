/**
 * Furniture Scraper — Configuration
 * All runtime config loaded from environment variables.
 * Never hardcode secrets here.
 */
import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
      `   Add it to your .env file. See .env.example for reference.`
    );
  }
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  apify: {
    token: process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN || '',
    ikeaActorId: process.env.APIFY_IKEA_ACTOR_ID || '',
  },
  scraper: {
    batchSize: parseInt(optionalEnv('SCRAPER_BATCH_SIZE', '500')),
    maxProductsPerSource: parseInt(optionalEnv('SCRAPER_MAX_PRODUCTS_PER_SOURCE', '1000')),
    delayMs: parseInt(optionalEnv('SCRAPER_DELAY_MS', '1200')),
    maxRetries: 3,
    retryDelayMs: 2000,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
} as const;

export function validateSupabaseConfig(): void {
  if (!config.supabase.url) {
    throw new Error(
      '❌ Missing SUPABASE_URL (or VITE_SUPABASE_URL)\n' +
      '   Add SUPABASE_URL=https://your-project.supabase.co to your .env file'
    );
  }
  if (!config.supabase.serviceRoleKey) {
    throw new Error(
      '❌ Missing SUPABASE_SERVICE_ROLE_KEY\n' +
      '   Add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to your .env file\n' +
      '   ⚠️  NEVER prefix this with VITE_ — it must stay server-side only'
    );
  }
}
