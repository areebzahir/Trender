-- ============================================================
-- TRENDER QUICK DATABASE SETUP
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click RUN to create tables AND insert seed data
-- ============================================================

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Step 2: Create trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
