-- ============================================================
-- MOCK / TEST SEED DATA — Ontario Furniture Stores & Products
-- ⚠️  This is fake data for development and testing only.
--     Do NOT use in production.
-- ============================================================

-- ── Stores ────────────────────────────────────────────────────────────────────

INSERT INTO stores (id, name, website, domain, city, province, postal_code, country, store_type, is_active, discovered_by, source_platform)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Maple & Oak Furniture',    'https://mapleandoak.ca',      'mapleandoak.ca',      'Toronto',      'ON', 'M5V 2T6', 'CA', 'local_shop',    TRUE, 'manual', 'manual'),
  ('11111111-0000-0000-0000-000000000002', 'Great Lakes Home Goods',   'https://greatlakeshome.ca',   'greatlakeshome.ca',   'Mississauga',  'ON', 'L5B 3A1', 'CA', 'local_shop',    TRUE, 'manual', 'manual'),
  ('11111111-0000-0000-0000-000000000003', 'Northern Comfort Interiors','https://northerncomfort.ca', 'northerncomfort.ca',  'Ottawa',       'ON', 'K1P 1J1', 'CA', 'local_shop',    TRUE, 'manual', 'manual'),
  ('11111111-0000-0000-0000-000000000004', 'Lakeshore Living Co.',     'https://lakeshoreliving.ca',  'lakeshoreliving.ca',  'Hamilton',     'ON', 'L8P 4S6', 'CA', 'local_shop',    TRUE, 'manual', 'manual'),
  ('11111111-0000-0000-0000-000000000005', 'Article Canada',           'https://article.com',         'article.com',         'Toronto',      'ON', 'M5A 1A1', 'CA', 'chain',         TRUE, 'manual', 'manual')
ON CONFLICT (normalized_domain) DO NOTHING;

-- ── Products ──────────────────────────────────────────────────────────────────

INSERT INTO products (
  id, store_id, title, normalized_title, description, category, brand,
  product_url, canonical_url, image_url,
  price, original_price, currency, on_sale,
  availability, condition, source_platform, is_active, first_seen_at, last_seen_at
) VALUES
  -- Maple & Oak
  ('22222222-0000-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'Walnut Slab Coffee Table',
   'walnut slab coffee table',
   'Handcrafted solid walnut coffee table with live edge. Made in Ontario.',
   'coffee_table', 'Maple & Oak',
   'https://mapleandoak.ca/products/walnut-coffee-table',
   'https://mapleandoak.ca/products/walnut-coffee-table',
   'https://images.unsplash.com/photo-1549497538-303791108f95?w=800',
   899.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000001',
   'Modern Beige Linen Sofa',
   'modern beige linen sofa',
   'Clean-lined sofa upholstered in natural linen. Solid oak legs. Perfect for modern and Japandi interiors.',
   'sofa', 'Maple & Oak',
   'https://mapleandoak.ca/products/beige-linen-sofa',
   'https://mapleandoak.ca/products/beige-linen-sofa',
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
   1799.00, 2199.00, 'CAD', TRUE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000001',
   'Oak Bookshelf 5-Tier',
   'oak bookshelf 5 tier',
   'Solid oak 5-tier bookshelf. Minimalist Scandinavian design. Ships flat-pack.',
   'bookshelf', 'Maple & Oak',
   'https://mapleandoak.ca/products/oak-bookshelf',
   'https://mapleandoak.ca/products/oak-bookshelf',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
   549.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  -- Great Lakes Home Goods
  ('22222222-0000-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000002',
   'Grey Velvet Sectional Sofa',
   'grey velvet sectional sofa',
   'Large L-shaped sectional in soft grey velvet. Reversible chaise. Solid wood frame.',
   'sectional', 'Great Lakes',
   'https://greatlakeshome.ca/products/grey-velvet-sectional',
   'https://greatlakeshome.ca/products/grey-velvet-sectional',
   'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
   2499.00, 2999.00, 'CAD', TRUE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000002',
   'Black Metal TV Stand 65"',
   'black metal tv stand 65',
   'Industrial-style TV stand with open shelving. Fits TVs up to 65". Powder-coated black steel.',
   'tv_stand', 'Great Lakes',
   'https://greatlakeshome.ca/products/black-tv-stand',
   'https://greatlakeshome.ca/products/black-tv-stand',
   'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
   449.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  -- Northern Comfort
  ('22222222-0000-0000-0000-000000000006',
   '11111111-0000-0000-0000-000000000003',
   'Cream Bouclé Accent Chair',
   'cream boucle accent chair',
   'Cozy bouclé accent chair in warm cream. Solid walnut legs. Great for reading nooks.',
   'accent_chair', 'Northern Comfort',
   'https://northerncomfort.ca/products/boucle-accent-chair',
   'https://northerncomfort.ca/products/boucle-accent-chair',
   'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
   699.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000007',
   '11111111-0000-0000-0000-000000000003',
   'Walnut Dining Table 6-Person',
   'walnut dining table 6 person',
   'Solid walnut dining table seats 6. Mid-century tapered legs. Made in Canada.',
   'dining_table', 'Northern Comfort',
   'https://northerncomfort.ca/products/walnut-dining-table',
   'https://northerncomfort.ca/products/walnut-dining-table',
   'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
   1299.00, 1599.00, 'CAD', TRUE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  -- Lakeshore Living
  ('22222222-0000-0000-0000-000000000008',
   '11111111-0000-0000-0000-000000000004',
   'White Platform Bed Frame Queen',
   'white platform bed frame queen',
   'Minimalist white platform bed frame. No box spring needed. Solid pine slats.',
   'bed_frame', 'Lakeshore Living',
   'https://lakeshoreliving.ca/products/white-platform-bed',
   'https://lakeshoreliving.ca/products/white-platform-bed',
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
   799.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000009',
   '11111111-0000-0000-0000-000000000004',
   'Rattan Side Table Round',
   'rattan side table round',
   'Natural rattan side table. Boho and coastal style. Lightweight and easy to move.',
   'side_table', 'Lakeshore Living',
   'https://lakeshoreliving.ca/products/rattan-side-table',
   'https://lakeshoreliving.ca/products/rattan-side-table',
   'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
   199.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  -- Article Canada
  ('22222222-0000-0000-0000-000000000010',
   '11111111-0000-0000-0000-000000000005',
   'Sven Charme Tan Sofa',
   'sven charme tan sofa',
   'Article Sven sofa in Charme Tan leather. Mid-century modern design. Ships to Ontario.',
   'sofa', 'Article',
   'https://article.com/products/sven-sofa-charme-tan',
   'https://article.com/products/sven-sofa-charme-tan',
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
   1699.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000011',
   '11111111-0000-0000-0000-000000000005',
   'Ceni Gold Dining Chair Set of 2',
   'ceni gold dining chair set of 2',
   'Article Ceni dining chairs in gold velvet. Set of 2. Mid-century tapered legs.',
   'dining_chair', 'Article',
   'https://article.com/products/ceni-dining-chair-gold',
   'https://article.com/products/ceni-dining-chair-gold',
   'https://images.unsplash.com/photo-1549497538-303791108f95?w=800',
   399.00, 499.00, 'CAD', TRUE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW()),

  ('22222222-0000-0000-0000-000000000012',
   '11111111-0000-0000-0000-000000000005',
   'Arca White Marble Coffee Table',
   'arca white marble coffee table',
   'Article Arca coffee table with white marble top and brass legs. Contemporary luxury.',
   'coffee_table', 'Article',
   'https://article.com/products/arca-coffee-table',
   'https://article.com/products/arca-coffee-table',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
   649.00, NULL, 'CAD', FALSE, 'in_stock', 'new', 'manual', TRUE, NOW(), NOW())
ON CONFLICT (canonical_url) DO NOTHING;

-- ── Product Dimensions ────────────────────────────────────────────────────────

INSERT INTO product_dimensions (product_id, width, height, depth, unit, raw_dimensions_text)
VALUES
  ('22222222-0000-0000-0000-000000000001', 48.0, 18.0, 24.0, 'inches', '48" W x 18" H x 24" D'),
  ('22222222-0000-0000-0000-000000000002', 84.0, 34.0, 38.0, 'inches', '84" W x 34" H x 38" D'),
  ('22222222-0000-0000-0000-000000000003', 32.0, 72.0, 12.0, 'inches', '32" W x 72" H x 12" D'),
  ('22222222-0000-0000-0000-000000000004', 110.0, 34.0, 65.0, 'inches', '110" W x 34" H x 65" D'),
  ('22222222-0000-0000-0000-000000000005', 60.0, 22.0, 16.0, 'inches', '60" W x 22" H x 16" D'),
  ('22222222-0000-0000-0000-000000000006', 30.0, 34.0, 32.0, 'inches', '30" W x 34" H x 32" D'),
  ('22222222-0000-0000-0000-000000000007', 72.0, 30.0, 36.0, 'inches', '72" W x 30" H x 36" D'),
  ('22222222-0000-0000-0000-000000000008', 62.0, 12.0, 82.0, 'inches', '62" W x 12" H x 82" D'),
  ('22222222-0000-0000-0000-000000000009', 20.0, 22.0, 20.0, 'inches', '20" W x 22" H x 20" D'),
  ('22222222-0000-0000-0000-000000000010', 88.0, 34.0, 38.0, 'inches', '88" W x 34" H x 38" D'),
  ('22222222-0000-0000-0000-000000000011', 20.0, 33.0, 22.0, 'inches', '20" W x 33" H x 22" D'),
  ('22222222-0000-0000-0000-000000000012', 44.0, 16.0, 24.0, 'inches', '44" W x 16" H x 24" D')
ON CONFLICT (product_id) DO NOTHING;

-- ── Product Attributes ────────────────────────────────────────────────────────

INSERT INTO product_attributes (product_id, colors, materials, styles, room_types, extracted_by)
VALUES
  ('22222222-0000-0000-0000-000000000001', ARRAY['walnut','brown'],       ARRAY['walnut','wood'],          ARRAY['modern','japandi','scandinavian'], ARRAY['living_room'],              'manual'),
  ('22222222-0000-0000-0000-000000000002', ARRAY['beige','cream'],        ARRAY['fabric','wood','oak'],    ARRAY['modern','minimalist','japandi'],   ARRAY['living_room'],              'manual'),
  ('22222222-0000-0000-0000-000000000003', ARRAY['oak','natural_wood'],   ARRAY['oak','wood'],             ARRAY['scandinavian','minimalist'],       ARRAY['living_room','office','bedroom'], 'manual'),
  ('22222222-0000-0000-0000-000000000004', ARRAY['grey'],                 ARRAY['velvet','fabric','wood'], ARRAY['modern','contemporary'],          ARRAY['living_room'],              'manual'),
  ('22222222-0000-0000-0000-000000000005', ARRAY['black'],                ARRAY['metal'],                  ARRAY['industrial','modern'],            ARRAY['living_room','bedroom'],    'manual'),
  ('22222222-0000-0000-0000-000000000006', ARRAY['cream','beige'],        ARRAY['fabric','walnut'],        ARRAY['modern','scandinavian','boho'],    ARRAY['living_room','bedroom'],    'manual'),
  ('22222222-0000-0000-0000-000000000007', ARRAY['walnut','brown'],       ARRAY['walnut','wood'],          ARRAY['mid_century','modern'],           ARRAY['dining_room'],              'manual'),
  ('22222222-0000-0000-0000-000000000008', ARRAY['white'],                ARRAY['wood'],                   ARRAY['minimalist','modern'],            ARRAY['bedroom'],                  'manual'),
  ('22222222-0000-0000-0000-000000000009', ARRAY['natural_wood','beige'], ARRAY['rattan'],                 ARRAY['boho','coastal'],                 ARRAY['living_room','bedroom'],    'manual'),
  ('22222222-0000-0000-0000-000000000010', ARRAY['brown','beige'],        ARRAY['leather'],                ARRAY['mid_century','modern'],           ARRAY['living_room'],              'manual'),
  ('22222222-0000-0000-0000-000000000011', ARRAY['gold','yellow'],        ARRAY['velvet','fabric'],        ARRAY['mid_century','glam'],             ARRAY['dining_room'],              'manual'),
  ('22222222-0000-0000-0000-000000000012', ARRAY['white','gold'],         ARRAY['marble','metal'],         ARRAY['luxury','contemporary','modern'],  ARRAY['living_room'],              'manual')
ON CONFLICT (product_id) DO NOTHING;
