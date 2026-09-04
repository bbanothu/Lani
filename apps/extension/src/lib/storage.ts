export interface LLMSettings {
  provider: 'claude' | 'openrouter' | 'ollama';
  apiKey: string;
  model: string;
  ollamaBaseUrl?: string;
}

const SETTINGS_KEY = 'lani_llm_settings';
const OUTBOX_KEY = 'lani_captured_products';
const SEEN_URLS_KEY = 'lani_seen_product_urls';
const PAUSED_KEY = 'lani_paused';

// The captured list is kept locally as a rolling history -- it is NOT a
// drain-once queue. Items stay after they sync (marked `synced`) so the side
// panel can show recent activity; only the newest MAX_CAPTURED are retained.
const MAX_CAPTURED = 20;

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
  // Set once the background worker has pushed this item to Supabase, so it
  // isn't re-processed on every sync tick while it stays in the local list.
  synced?: boolean;
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
      const outbox: CapturedProduct[] = result[OUTBOX_KEY] || [];
      const deduped = outbox.filter((p) => p.url !== product.url);
      const next = [product, ...deduped].slice(0, MAX_CAPTURED);
      chrome.storage.local.set({ [OUTBOX_KEY]: next }, () => resolve());
    });
  });
}

// Mark queued items as synced in place (instead of removing them) so they
// stay visible in the side panel but don't get re-sent next tick.
export function markOutboxSynced(urls: string[]): Promise<void> {
  const done = new Set(urls);
  return new Promise((resolve) => {
    chrome.storage.local.get(OUTBOX_KEY, (result) => {
      const outbox: CapturedProduct[] = result[OUTBOX_KEY] || [];
      const next = outbox.map((p) => (done.has(p.url) ? { ...p, synced: true } : p));
      chrome.storage.local.set({ [OUTBOX_KEY]: next }, () => resolve());
    });
  });
}

// Revisiting a product that's already in the local list: move its entry to
// the front and refresh its timestamp. No-op if the url isn't in the list.
// (The synced Supabase row is reordered separately via bumpProduct.)
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
