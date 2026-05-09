# Furniture Scraper — Schema Mapping

## Overview

This document maps scraped furniture fields to the existing Supabase tables.
No new tables are created. All data flows into the 10 existing tables.

---

## Table: `stores`

| Scraped Field       | Column              | Notes                                      |
|---------------------|---------------------|--------------------------------------------|
| store name          | `name`              | Required                                   |
| website URL         | `website`           | Full URL e.g. https://www.article.com/     |
| domain              | `domain`            | e.g. article.com (auto-extracted)          |
| country             | `country`           | Always 'CA'                                |
| province            | `province`          | 'ON' for Ontario stores                    |
| city                | `city`              | If known                                   |
| scrape strategy     | `source_platform`   | 'apify', 'custom_crawler', 'manual'        |
| is active           | `is_active`         | true                                       |
| scrape notes        | `scrape_notes`      | Strategy notes, limitations                |
| discovered by       | `discovered_by`     | 'manual'                                   |
| store type          | `store_type`        | 'chain', 'marketplace', 'local_shop', etc. |

**Deduplication**: `normalized_domain` (GENERATED ALWAYS, UNIQUE index)

---

## Table: `store_locations`

| Scraped Field  | Column       | Notes                        |
|----------------|--------------|------------------------------|
| store_id       | `store_id`   | FK to stores.id              |
| label          | `label`      | e.g. "Mississauga Location"  |
| address        | `address`    | Street address               |
| city           | `city`       | City name                    |
| province       | `province`   | 'ON'                         |
| postal code    | `postal_code`| Canadian postal code         |
| phone          | `phone`      | Store phone                  |
| lat/lng        | `latitude` / `longitude` | If available    |

---

## Table: `products`

| Scraped Field        | Column               | Notes                                          |
|----------------------|----------------------|------------------------------------------------|
| store_id             | `store_id`           | FK to stores.id                                |
| title / name         | `title`              | Required — skip if missing                     |
| description          | `description`        | HTML stripped                                  |
| inferred category    | `category`           | CHECK constraint — must match enum values      |
| subcategory          | `subcategory`        | Free text                                      |
| brand / vendor       | `brand`              | e.g. 'IKEA', 'Article'                         |
| sku / article number | `sku`                | Product identifier                             |
| product URL          | `product_url`        | Required — skip if missing                     |
| canonical URL        | `canonical_url`      | Normalized URL (tracking params stripped)      |
| primary image        | `image_url`          | Required — skip if missing                     |
| gallery images       | `additional_images`  | TEXT[] array                                   |
| price                | `price`              | NUMERIC(10,2) CAD                              |
| compare_at_price     | `original_price`     | If higher than price → on_sale = true          |
| currency             | `currency`           | Always 'CAD'                                   |
| on_sale              | `on_sale`            | true if original_price > price                 |
| availability         | `availability`       | in_stock / out_of_stock / limited / unknown    |
| condition            | `condition`          | Always 'new' for scraped products              |
| source platform      | `source_platform`    | 'apify', 'custom_crawler'                      |
| scrape job id        | `scrape_job_id`      | FK to scrape_jobs.id                           |
| raw source data      | `raw_payload`        | Full original JSON                             |
| normalized title     | `normalized_title`   | Lowercased, stripped (for dedup)               |
| last seen            | `last_seen_at`       | Updated on every scrape                        |
| is active            | `is_active`          | true                                           |

**Deduplication priority**:
1. `canonical_url` (UNIQUE index — strongest)
2. `store_id + sku` (UNIQUE index)
3. `store_id + normalized_title + price` (fuzzy fallback)

**Category CHECK constraint** — must be one of:
`sofa`, `sectional`, `loveseat`, `armchair`, `accent_chair`, `coffee_table`,
`side_table`, `dining_table`, `dining_chair`, `bed_frame`, `mattress`,
`nightstand`, `dresser`, `wardrobe`, `tv_stand`, `media_console`, `desk`,
`office_chair`, `bookshelf`, `storage_cabinet`, `rug`, `lighting`, `mirror`,
`decor`, `unknown`

---

## Table: `product_dimensions`

| Scraped Field       | Column                | Notes                          |
|---------------------|-----------------------|--------------------------------|
| width               | `width`               | NUMERIC(8,2)                   |
| height              | `height`              | NUMERIC(8,2)                   |
| depth               | `depth`               | NUMERIC(8,2)                   |
| length              | `length`              | NUMERIC(8,2)                   |
| seat height         | `seat_height`         | NUMERIC(8,2)                   |
| weight              | `weight`              | NUMERIC(8,2)                   |
| unit                | `unit`                | 'inches' or 'cm' or 'mm'       |
| raw dimension text  | `raw_dimensions_text` | Original string preserved      |

**Note**: Inches are converted to cm where possible. Unit stored as-is.
**Deduplication**: UNIQUE on `product_id`

---

## Table: `product_attributes`

| Scraped Field   | Column              | Notes                                    |
|-----------------|---------------------|------------------------------------------|
| colors          | `colors`            | TEXT[] — normalized color names          |
| materials       | `materials`         | TEXT[] — normalized material names       |
| styles          | `styles`            | TEXT[] — normalized style tags           |
| room types      | `room_types`        | TEXT[] — inferred from category          |
| tags            | `tags`              | TEXT[] — product type, subcategory tags  |
| extracted_by    | `extracted_by`      | 'rule_based'                             |

**Deduplication**: UNIQUE on `product_id`

---

## Table: `product_embeddings`

| Field       | Column        | Notes                                              |
|-------------|---------------|----------------------------------------------------|
| source_text | `source_text` | Pre-built embedding text (title + attrs)           |
| embedding   | `embedding`   | NULL — populated later by generateEmbeddings.ts    |
| model       | `model`       | 'pending' until embedding is generated             |

**Strategy**: Insert placeholder row with `source_text` and `embedding = NULL`.
This marks the product as needing embedding generation.

---

## Table: `scrape_jobs`

| Field          | Column           | Notes                                        |
|----------------|------------------|----------------------------------------------|
| source type    | `source_type`    | 'apify' or 'custom_crawler'                  |
| source name    | `source_name`    | e.g. 'scrapeShopifyStore:article.com'        |
| target URL     | `target_url`     | Store website URL                            |
| status         | `status`         | queued → running → completed/failed          |
| started_at     | `started_at`     | Set when job starts                          |
| finished_at    | `finished_at`    | Set when job ends                            |
| total_found    | `total_found`    | Products discovered                          |
| total_inserted | `total_inserted` | New products saved                           |
| total_updated  | `total_updated`  | Existing products updated                    |
| total_failed   | `total_failed`   | Products that errored                        |
| error_message  | `error_message`  | Set on failure                               |
| raw_config     | `raw_config`     | Scraper config JSON                          |

---

## Table: `scrape_job_items`

| Field         | Column          | Notes                                         |
|---------------|-----------------|-----------------------------------------------|
| job_id        | `job_id`        | FK to scrape_jobs.id                          |
| external_id   | `external_id`   | Source product ID (Shopify ID, IKEA item no.) |
| product_url   | `product_url`   | URL of the scraped product                    |
| status        | `status`        | inserted / updated / skipped / failed         |
| error_message | `error_message` | Error detail if failed                        |
| raw_payload   | `raw_payload`   | Raw scraped data for debugging                |

---

## Tables NOT Modified

- `room_photos` — user-facing, not touched
- `furniture_request_logs` — user-facing, not touched

---

## Fields With No Direct Column

These scraped fields have no dedicated column but are preserved in `raw_payload` (JSONB):

- `rating` / `review_count`
- `delivery_info` (stored in `delivery_info` TEXT column)
- `pickup_available` (stored in `pickup_available` BOOLEAN)
- `location_availability` (stored in `location_availability` TEXT[])
- `aesthetic_tags` → stored in `tags` array in `product_attributes`
- `furniture_type` → stored in `subcategory` + `tags`
- `room_type` → stored in `room_types` array in `product_attributes`

---

## No Schema Changes Required

The existing schema covers all required fields. No `ALTER TABLE` statements needed.
All scraper data maps cleanly into existing columns.
