#!/usr/bin/env tsx
/**
 * IKEA Canada Product Ingestion via Apify
 * 
 * Uses Apify's IKEA scraper to collect full product catalog from IKEA Canada.
 * This is the production-ready approach for complete catalog ingestion.
 * 
 * Usage:
 *   npm run ingest:ikea-apify
 *   npm run ingest:ikea-apify -- --dry-run
 *   npm run ingest:ikea-apify -- --limit=50
 *   npm run ingest:ikea-apify -- --categories=sofas,beds
 */

import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';
import type {
  ProductInput,
  StoreInput,
  ProductCategory,
  ProductAvailability,
  ProductDimensionInput,
  ProductAttributesInput,
} from '../src/lib/ingestion/types';
import { upsertStore } from '../src/lib/ingestion/upsertStore';
import { upsertProduct } from '../src/lib/ingestion/upsertProduct';
import { toNormalizedProduct } from '../src/lib/ingestion/normalizeProduct';

// ─── Configuration ────────────────────────────────────────────────────────────

const IKEA_CA_BASE_URL = 'https://www.ikea.com/ca/en';
const APIFY_ACTOR_ID = 'happyendpoint/ikea-scraper'; // Most complete IKEA scraper

// ─── CLI Arguments ────────────────────────────────────────────────────────────

interface CliArgs {
  dryRun: boolean;
  limit: number | null;
  categories: string[] | null;
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const categoriesArg = args.find(a => a.startsWith('--categories='))?.split('=')[1];
  
  return {
    dryRun: args.includes('--dry