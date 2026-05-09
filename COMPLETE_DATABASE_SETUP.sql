-- ============================================================
-- TRENDER COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor to:
-- 1. Create all 10 tables
-- 2. Insert seed data (5 stores, 12 products)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: stores
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  website           TEXT,
  domain            TEXT,
  phone             TEXT,
  email             TEXT,
  address           TEXT,
  city              TEXT,
  province          TEXT DEFAULT 'ON',
  postal_code       TEXT,
  country           TEXT DEFAULT 'CA',
  latitude          NUMERIC(10, 7),
  longitude         NUMERIC(10, 7),
  store_type        TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (store_type IN ('local_shop','chain','marketplace','manufacturer','unknown')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  discovered_by     TEXT,
  source_url        TEXT,
  source_platform   TEXT,
  scrape_allowed    BOOLEAN DEFAULT TRUE,
  scrape_notes      TEXT,
  normalized_domain TEXT GENERATED ALWAYS AS (
    LOWER(REGEXP_REPLACE(COALESCE(domain, ''), '^www\.', ''))
  ) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS stores_normalized_domain_idx
  ON stores (normalized_domain)
  WHERE normalized_domain IS NOT NULL AND normalized_domain <> '';

CREATE INDEX IF NOT EXISTS stores_city_idx       ON stores (city);
CREATE INDEX IF NOT EXISTS stores_province_idx   ON stores (province);
CREATE INDEX IF NOT EXISTS stores_store_type_idx ON stores (store_type);
CREATE INDEX IF NOT EXISTS stores_is_active_idx  ON stores (is_active);

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
