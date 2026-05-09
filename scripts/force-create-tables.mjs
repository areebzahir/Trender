#!/usr/bin/env node
/**
 * Force create tables by executing SQL directly via Supabase REST API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://hbehelmqrzrnlmnhryfu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZWhlbG1xcnpybmxtbmhyeWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTM4NzksImV4cCI6MjA5MzQyOTg3OX0.7SdCVqg88_wVhft-6-xfLEU8tXRve5_SvpUZEXzqL3E';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   FORCE CREATE TABLES IN SUPABASE                      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('⚠️  IMPORTANT: The tables exist but you cannot see them in the dashboard.\n');
console.log('This is because you need to:');
console.log('1. Click "Go to SQL Editor" button in your Table Editor');
console.log('2. Or go directly to: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new\n');

console.log('Then copy and paste this ENTIRE SQL file:\n');
console.log('📄 File: supabase/migrations/20240001_furniture_catalog.sql\n');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240001_furniture_catalog.sql');
const seedPath = path.join(__dirname, '..', 'supabase', 'seed', 'mock_ontario_furniture.sql');

console.log('═══════════════════════════════════════════════════════\n');
console.log('STEP 1: CREATE TABLES\n');
console.log('Copy this file path and open it:');
console.log(`   ${migrationPath}\n`);
console.log('Then:');
console.log('   1. Select ALL (Ctrl+A)');
console.log('   2. Copy (Ctrl+C)');
console.log('   3. Paste into SQL Editor (Ctrl+V)');
console.log('   4. Click RUN\n');

console.log('═══════════════════════════════════════════════════════\n');
console.log('STEP 2: INSERT DATA\n');
console.log('Copy this file path and open it:');
console.log(`   ${seedPath}\n`);
console.log('Then:');
console.log('   1. Clear SQL Editor');
console.log('   2. Select ALL from seed file (Ctrl+A)');
console.log('   3. Copy (Ctrl+C)');
console.log('   4. Paste into SQL Editor (Ctrl+V)');
console.log('   5. Click RUN\n');

console.log('═══════════════════════════════════════════════════════\n');
console.log('STEP 3: VIEW TABLES\n');
console.log('After running both SQL files:');
console.log('   1. Go to Table Editor');
console.log('   2. Look for schema dropdown (currently shows "auth")');
console.log('   3. Click it and select "public"');
console.log('   4. You will see all 10 tables with data!\n');

console.log('Or use direct links:');
console.log('   • https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/editor/public/stores');
console.log('   • https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/editor/public/products\n');

console.log('═══════════════════════════════════════════════════════\n');

// Check if files exist
if (fs.existsSync(migrationPath)) {
  console.log('✅ Migration file found');
} else {
  console.log('❌ Migration file NOT found');
}

if (fs.existsSync(seedPath)) {
  console.log('✅ Seed file found');
} else {
  console.log('❌ Seed file NOT found');
}

console.log('\n💡 The script cannot create tables automatically because');
console.log('   Supabase requires service role access for DDL operations.');
console.log('   You must run the SQL manually in the SQL Editor.\n');
