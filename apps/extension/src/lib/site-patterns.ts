// Known e-commerce domains and the URL shape that identifies an actual
// product page there (vs. their homepage/search/category/cart pages). Used
// as a fast pre-filter so a site we already know well doesn't waste an AI
// call -- or worse, get mis-captured -- on a non-product page. Sites not
// listed here just fall through to the AI check for every page, as before.
export const PRODUCT_URL_PATTERNS: Record<string, RegExp> = {
  amazon: /\/(dp|gp\/product)\/[A-Z0-9]{10}/,
  ebay: /\/itm\//,
  etsy: /\/listing\/\d+/,
  walmart: /\/ip\//,
  target: /\/p\//,
  bestbuy: /\/sku\/\d+/,
};

// Matches on a full domain label (e.g. "amazon" in "www.amazon.co.uk"),
// not a raw substring -- "notamazon.com" must not match "amazon".
export function matchesKnownRetailer(domain: string): RegExp | null {
  const labels = domain.toLowerCase().split('.');
  for (const [brand, pattern] of Object.entries(PRODUCT_URL_PATTERNS)) {
    if (labels.includes(brand)) return pattern;
  }
  return null;
}
