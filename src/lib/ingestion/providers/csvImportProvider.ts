/**
 * CSV Import Provider
 *
 * Parses a CSV file (admin/manual import) into NormalizedFurnitureProduct[].
 *
 * Expected CSV columns (all optional except title and product_url):
 *   title, description, product_url, image_url, price, original_price,
 *   currency, brand, sku, category, colors, materials, styles,
 *   width, height, depth, unit, dimensions_text,
 *   store_name, store_website, store_city, store_province, store_type,
 *   availability, condition, delivery_info
 *
 * Usage:
 *   const products = parseCsvToProducts(csvString)
 *   await runIngestion({ products, source_type: 'csv', source_name: 'manual_import' })
 */

import { toNormalizedProduct } from '../normalizeProduct';
import type { NormalizedFurnitureProduct, ProductDimensionInput } from '../types';

export interface CsvRow {
  title?:           string;
  description?:     string;
  product_url?:     string;
  image_url?:       string;
  price?:           string;
  original_price?:  string;
  currency?:        string;
  brand?:           string;
  sku?:             string;
  category?:        string;
  colors?:          string;   // comma-separated
  materials?:       string;   // comma-separated
  styles?:          string;   // comma-separated
  width?:           string;
  height?:          string;
  depth?:           string;
  unit?:            string;
  dimensions_text?: string;
  store_name?:      string;
  store_website?:   string;
  store_city?:      string;
  store_province?:  string;
  store_type?:      string;
  availability?:    string;
  condition?:       string;
  delivery_info?:   string;
  [key: string]: string | undefined;
}

/**
 * Minimal CSV parser — handles quoted fields and commas within quotes.
 * For production use, replace with a library like papaparse.
 */
export function parseCsvString(csv: string): CsvRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Convert parsed CSV rows into NormalizedFurnitureProduct[].
 */
export function csvRowsToProducts(rows: CsvRow[]): NormalizedFurnitureProduct[] {
  const results: NormalizedFurnitureProduct[] = [];

  for (const row of rows) {
    if (!row.title || !row.product_url) continue;

    const dimensions: ProductDimensionInput | undefined =
      row.width || row.height || row.depth
        ? {
            width:              row.width  ? parseFloat(row.width)  : undefined,
            height:             row.height ? parseFloat(row.height) : undefined,
            depth:              row.depth  ? parseFloat(row.depth)  : undefined,
            unit:               (row.unit as ProductDimensionInput['unit']) ?? 'inches',
            raw_dimensions_text: row.dimensions_text,
          }
        : undefined;

    try {
      results.push(
        toNormalizedProduct({
          title:           row.title,
          description:     row.description,
          product_url:     row.product_url,
          image_url:       row.image_url,
          price:           row.price,
          original_price:  row.original_price,
          currency:        row.currency ?? 'CAD',
          brand:           row.brand,
          sku:             row.sku,
          colors:          row.colors?.split(',').map(s => s.trim()),
          materials:       row.materials?.split(',').map(s => s.trim()),
          styles:          row.styles?.split(',').map(s => s.trim()),
          dimensions,
          availability:    row.availability as NormalizedFurnitureProduct['availability'],
          condition:       row.condition as NormalizedFurnitureProduct['condition'],
          delivery_info:   row.delivery_info,
          source_platform: 'csv',
          store: {
            name:            row.store_name ?? 'Unknown Store',
            website:         row.store_website,
            city:            row.store_city,
            province:        row.store_province ?? 'ON',
            country:         'CA',
            store_type:      (row.store_type as StoreInput['store_type']) ?? 'unknown',
            source_platform: 'csv',
          },
          raw_payload: row as Record<string, unknown>,
        })
      );
    } catch (err) {
      console.warn('[csvImportProvider] Failed to normalize row:', row.title, err);
    }
  }

  return results;
}

/**
 * Full pipeline: CSV string → NormalizedFurnitureProduct[]
 */
export function parseCsvToProducts(csvString: string): NormalizedFurnitureProduct[] {
  const rows = parseCsvString(csvString);
  return csvRowsToProducts(rows);
}

// Fix missing import
import type { StoreInput } from '../types';
