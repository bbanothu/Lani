export interface LLMSettings {
  provider: 'claude' | 'openrouter' | 'ollama';
  apiKey: string;
  model: string;
  ollamaBaseUrl?: string;
}

const SETTINGS_KEY = 'lani_llm_settings';
const OUTBOX_KEY = 'lani_captured_products';
const NO_PRODUCT_DOMAINS_KEY = 'lani_no_product_domains';
const SEEN_URLS_KEY = 'lani_seen_product_urls';
const LOGS_KEY = 'lani_logs';
const MAX_LOGS = 200;
const PAUSED_KEY = 'lani_paused';

const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'ollama',
  apiKey: '',
  model: 'llama3.1',
  ollamaBaseUrl: 'http://localhost:11434/v1',
};

export function getSettings(): Promise<LLMSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      resolve(result[SETTINGS_KEY] || DEFAULT_SETTINGS);
    });
  });
}

export function saveSettings(settings: LLMSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => resolve());
  });
}

export interface CapturedProduct {
  title: string;
  price: number | null;
  currency: string;
  image: string | null;
  url: string;
  domain: string;
  tags: string[];
  capturedAt: string;
}

export function getOutbox(): Promise<CapturedProduct[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(OUTBOX_KEY, (result) => resolve(result[OUTBOX_KEY] || []));
  });
}

export function clearOutbox(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [OUTBOX_KEY]: [] }, () => resolve());
  });
}

export function addToOutbox(product: CapturedProduct): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(OUTBOX_KEY, (result) => {
      const outbox = result[OUTBOX_KEY] || [];
      chrome.storage.local.set({ [OUTBOX_KEY]: [product, ...outbox] }, () => resolve());
    });
  });
}

// Revisiting a product that's still sitting in the local queue (captured but
// not yet synced): don't queue a second copy -- just move the existing entry
// to the front and refresh its timestamp so it sorts to the top of the
// dashboard once it syncs. No-op if the url isn't queued (already synced --
// the background worker's bumpProduct handles that case against Supabase).
export function touchOutboxUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(OUTBOX_KEY, (result) => {
      const outbox: CapturedProduct[] = result[OUTBOX_KEY] || [];
      const idx = outbox.findIndex((p) => p.url === url);
      if (idx === -1) return resolve();
      const [item] = outbox.splice(idx, 1);
      chrome.storage.local.set(
        { [OUTBOX_KEY]: [{ ...item, capturedAt: new Date().toISOString() }, ...outbox] },
        () => resolve(),
      );
    });
  });
}

// Domains the AI has already said "not a product page" for -- skips asking
// again on every future page load on that domain. Only ever grows from a
// "no" answer; a "yes" on one page doesn't imply every page on the domain
// is a product, so it's never used to skip-and-capture.
export function isDomainKnownNonProduct(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(NO_PRODUCT_DOMAINS_KEY, (result) => {
      resolve(Boolean((result[NO_PRODUCT_DOMAINS_KEY] || {})[domain]));
    });
  });
}

export function markDomainAsNonProduct(domain: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(NO_PRODUCT_DOMAINS_KEY, (result) => {
      const domains = result[NO_PRODUCT_DOMAINS_KEY] || {};
      domains[domain] = true;
      chrome.storage.local.set({ [NO_PRODUCT_DOMAINS_KEY]: domains }, () => resolve());
    });
  });
}

export function getNonProductDomains(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(NO_PRODUCT_DOMAINS_KEY, (result) => {
      resolve(Object.keys(result[NO_PRODUCT_DOMAINS_KEY] || {}).sort());
    });
  });
}

export function unmarkDomainAsNonProduct(domain: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(NO_PRODUCT_DOMAINS_KEY, (result) => {
      const domains = result[NO_PRODUCT_DOMAINS_KEY] || {};
      delete domains[domain];
      chrome.storage.local.set({ [NO_PRODUCT_DOMAINS_KEY]: domains }, () => resolve());
    });
  });
}

export function clearNonProductDomains(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [NO_PRODUCT_DOMAINS_KEY]: {} }, () => resolve());
  });
}

// Exact URLs already captured, so revisiting the same product page doesn't
// add a duplicate every time.
export function hasSeenUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SEEN_URLS_KEY, (result) => {
      resolve(Boolean((result[SEEN_URLS_KEY] || {})[url]));
    });
  });
}

export function markUrlAsSeen(url: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SEEN_URLS_KEY, (result) => {
      const urls = result[SEEN_URLS_KEY] || {};
      urls[url] = true;
      chrome.storage.local.set({ [SEEN_URLS_KEY]: urls }, () => resolve());
    });
  });
}

export type LogLevel = 'info' | 'success' | 'error';

export interface LogEntry {
  time: string;
  domain: string;
  level: LogLevel;
  message: string;
}

// Activity feed for the side panel's Logs tab -- capped so it can't grow
// unbounded across a long browsing session.
export function addLog(domain: string, message: string, level: LogLevel = 'info'): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(LOGS_KEY, (result) => {
      const logs: LogEntry[] = result[LOGS_KEY] || [];
      const next = [{ time: new Date().toISOString(), domain, level, message }, ...logs].slice(
        0,
        MAX_LOGS,
      );
      chrome.storage.local.set({ [LOGS_KEY]: next }, () => resolve());
    });
  });
}

export function getLogs(): Promise<LogEntry[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(LOGS_KEY, (result) => resolve(result[LOGS_KEY] || []));
  });
}

export function clearLogs(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [LOGS_KEY]: [] }, () => resolve());
  });
}

// Global on/off switch for the auto-detect content script -- when paused it
// exits immediately on every page load, no AI calls, no capturing.
export function isPaused(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(PAUSED_KEY, (result) => resolve(Boolean(result[PAUSED_KEY])));
  });
}

export function setPaused(paused: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PAUSED_KEY]: paused }, () => resolve());
  });
}
