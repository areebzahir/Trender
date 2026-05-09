/**
 * Furniture store source definitions.
 * Each entry maps to a row in the `stores` table and defines
 * which scraper strategy to use.
 */

export type ScrapeStrategy =
  | 'ikea_apify'
  | 'shopify_products_json'
  | 'custom_cheerio'
  | 'custom_playwright'
  | 'apify'
  | 'manual';

export interface StoreSource {
  name: string;
  website: string;
  domain: string;
  country: string;
  province: string | null;
  city: string | null;
  storeType: 'chain' | 'marketplace' | 'local_shop' | 'manufacturer' | 'unknown';
  scrapeStrategy: ScrapeStrategy;
  scrapeNotes?: string;
  isActive: boolean;
}

export const STORE_SOURCES: StoreSource[] = [
  // ── Major Canadian Chains ──────────────────────────────────────────────────
  {
    name: 'IKEA Canada',
    website: 'https://www.ikea.com/ca/en/',
    domain: 'ikea.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'ikea_apify',
    scrapeNotes: 'Use Apify IKEA actor. Set APIFY_IKEA_ACTOR_ID in .env',
    isActive: true,
  },
  {
    name: 'Structube',
    website: 'https://www.structube.com/',
    domain: 'structube.com',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Shopify but /products.json blocked — use Playwright',
    isActive: true,
  },
  {
    name: 'Article',
    website: 'https://www.article.com/',
    domain: 'article.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json blocked — use Playwright',
    isActive: true,
  },
  {
    name: 'Wayfair Canada',
    website: 'https://www.wayfair.ca/',
    domain: 'wayfair.ca',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'marketplace',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Large marketplace — requires JS rendering, rate limit carefully',
    isActive: true,
  },
  {
    name: 'The Brick',
    website: 'https://www.thebrick.com/',
    domain: 'thebrick.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Dynamic site — requires JS rendering',
    isActive: true,
  },
  {
    name: "Leon's",
    website: 'https://www.leons.ca/',
    domain: 'leons.ca',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Dynamic site — requires JS rendering',
    isActive: true,
  },
  {
    name: 'Urban Barn',
    website: 'https://www.urbanbarn.com/',
    domain: 'urbanbarn.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json returns 410 — use Playwright',
    isActive: true,
  },
  {
    name: 'EQ3',
    website: 'https://www.eq3.com/ca/en',
    domain: 'eq3.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json blocked — use Playwright',
    isActive: true,
  },
  {
    name: 'Bouclair',
    website: 'https://www.bouclair.com/',
    domain: 'bouclair.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'shopify_products_json',
    scrapeNotes: 'Shopify store',
    isActive: true,
  },
  {
    name: 'JYSK Canada',
    website: 'https://www.jysk.ca/',
    domain: 'jysk.ca',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_cheerio',
    scrapeNotes: 'Static-ish site — try cheerio first',
    isActive: true,
  },
  {
    name: 'Ashley HomeStore Canada',
    website: 'https://ashleyhomestore.ca/',
    domain: 'ashleyhomestore.ca',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Dynamic site',
    isActive: true,
  },
  {
    name: 'Mobilia',
    website: 'https://mobilia.ca/',
    domain: 'mobilia.ca',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json blocked',
    isActive: true,
  },
  {
    name: 'Wazo Furniture',
    website: 'https://www.wazofurniture.com/',
    domain: 'wazofurniture.com',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json blocked',
    isActive: true,
  },
  {
    name: 'Rove Concepts',
    website: 'https://www.roveconcepts.com/',
    domain: 'roveconcepts.com',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json returns 404',
    isActive: true,
  },
  {
    name: 'Cozey',
    website: 'https://www.cozey.ca/',
    domain: 'cozey.ca',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json redirects/blocked',
    isActive: true,
  },
  {
    name: 'Silk & Snow',
    website: 'https://www.silkandsnow.com/',
    domain: 'silkandsnow.com',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json redirects — use Playwright',
    isActive: true,
  },
  {
    name: 'Endy',
    website: 'https://www.endy.com/',
    domain: 'endy.com',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'manufacturer',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json returns 404',
    isActive: true,
  },
  {
    name: 'Canadian Tire',
    website: 'https://www.canadiantire.ca/',
    domain: 'canadiantire.ca',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'chain',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Large retailer — complex JS site, furniture section only',
    isActive: true,
  },
  {
    name: 'Walmart Canada',
    website: 'https://www.walmart.ca/',
    domain: 'walmart.ca',
    country: 'CA',
    province: null,
    city: null,
    storeType: 'marketplace',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: 'Large marketplace — furniture section only, rate limit carefully',
    isActive: true,
  },
  // ── Ontario Local Stores ───────────────────────────────────────────────────
  {
    name: 'Stoney Creek Furniture',
    website: 'https://www.stoneycreekfurniture.com/',
    domain: 'stoneycreekfurniture.com',
    country: 'CA',
    province: 'ON',
    city: 'Stoney Creek',
    storeType: 'local_shop',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json blocked',
    isActive: true,
  },
  {
    name: 'Casalife',
    website: 'https://www.casalife.com/',
    domain: 'casalife.com',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'local_shop',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json returns 404',
    isActive: true,
  },
  {
    name: 'Decorium',
    website: 'https://www.decorium.com/',
    domain: 'decorium.com',
    country: 'CA',
    province: 'ON',
    city: 'Toronto',
    storeType: 'local_shop',
    scrapeStrategy: 'custom_cheerio',
    scrapeNotes: 'Custom site — try cheerio',
    isActive: true,
  },
  {
    name: 'Elte',
    website: 'https://www.elte.com/',
    domain: 'elte.com',
    country: 'CA',
    province: 'ON',
    city: 'Toronto',
    storeType: 'local_shop',
    scrapeStrategy: 'shopify_products_json',
    scrapeNotes: 'Shopify store',
    isActive: true,
  },
  {
    name: 'Stylegarage',
    website: 'https://www.stylegarage.com/',
    domain: 'stylegarage.com',
    country: 'CA',
    province: 'ON',
    city: 'Toronto',
    storeType: 'local_shop',
    scrapeStrategy: 'shopify_products_json',
    scrapeNotes: 'Shopify store',
    isActive: true,
  },
  {
    name: 'Shelter Furniture',
    website: 'https://www.shelterfurniture.ca/',
    domain: 'shelterfurniture.ca',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'local_shop',
    scrapeStrategy: 'custom_cheerio',
    scrapeNotes: 'Custom site',
    isActive: true,
  },
  {
    name: 'GH Home',
    website: 'https://ghhome.ca/',
    domain: 'ghhome.ca',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'local_shop',
    scrapeStrategy: 'custom_playwright',
    scrapeNotes: '/products.json returns 404',
    isActive: true,
  },
  {
    name: 'Cornerstone Home Interiors',
    website: 'https://www.cornerstonefurniture.ca/',
    domain: 'cornerstonefurniture.ca',
    country: 'CA',
    province: 'ON',
    city: null,
    storeType: 'local_shop',
    scrapeStrategy: 'custom_cheerio',
    scrapeNotes: 'Custom site',
    isActive: true,
  },
  {
    name: 'Parliament Furniture',
    website: 'https://www.parliamentfurniture.com/',
    domain: 'parliamentfurniture.com',
    country: 'CA',
    province: 'ON',
    city: 'Toronto',
    storeType: 'local_shop',
    scrapeStrategy: 'shopify_products_json',
    scrapeNotes: 'Shopify store',
    isActive: true,
  },
];

/** Stores that use Shopify /products.json strategy */
export const SHOPIFY_STORES = STORE_SOURCES.filter(
  s => s.scrapeStrategy === 'shopify_products_json'
);

/** Stores that use IKEA Apify strategy */
export const IKEA_STORES = STORE_SOURCES.filter(
  s => s.scrapeStrategy === 'ikea_apify'
);

/** Stores that use custom Cheerio strategy */
export const CHEERIO_STORES = STORE_SOURCES.filter(
  s => s.scrapeStrategy === 'custom_cheerio'
);

/** Stores that use custom Playwright strategy */
export const PLAYWRIGHT_STORES = STORE_SOURCES.filter(
  s => s.scrapeStrategy === 'custom_playwright'
);
