/**
 * Scrape job lifecycle management.
 * Delegates to the shared ingestion layer.
 */
export {
  createScrapeJob,
  startScrapeJob,
  completeScrapeJob,
  failScrapeJob,
  recordScrapeJobItem,
} from '../../../src/lib/ingestion/createScrapeJob';
