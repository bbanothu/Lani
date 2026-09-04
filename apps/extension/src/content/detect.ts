import { extractProductInfo } from '../lib/extract';
import { matchesKnownRetailer } from '../lib/site-patterns';
import {
  LLMSettings,
  getSettings,
  addToOutbox,
  hasSeenUrl,
  markUrlAsSeen,
  touchOutboxUrl,
  isPaused,
} from '../lib/storage';

// The actual fetch has to run in the background worker, not here -- a
// content script's fetch runs inside this page's security context, so an
// https:// page can't reach a plain http://localhost Ollama endpoint.
function askBackground(prompt: string, settings: LLMSettings): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'classify', prompt, settings }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!response?.ok) {
        reject(new Error(response?.error || 'Unknown error'));
      } else {
        resolve(response.answer);
      }
    });
  });
}

// We've captured this exact URL before -- don't scrape it a second time.
// Just move its card back to the top of the dashboard: refresh the queued
// entry if it hasn't synced yet, and tell the background worker to bump the
// synced row.
async function bumpAlreadyCaptured(url: string) {
  await touchOutboxUrl(url);
  chrome.runtime.sendMessage({ type: 'bumpProduct', url });
}

function isSignedIn(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'authGetUser' }, (response) => {
      resolve(Boolean(response?.ok && response.user));
    });
  });
}

async function main() {
  if (await isPaused()) return;
  if (!(await isSignedIn())) return;

  const url = window.location.href;

  // Known retailers (Amazon, eBay, etc.) get a URL-shape pre-filter: those
  // sites mix product pages with search/cart/home pages under one domain. A
  // URL that doesn't match the known shape isn't necessarily NOT a product
  // page -- our regex guesses are incomplete -- so that case falls through
  // to the AI instead of being auto-skipped.
  const knownPattern = matchesKnownRetailer(window.location.hostname);

  if (knownPattern && knownPattern.test(url)) {
    if (await hasSeenUrl(url)) {
      await bumpAlreadyCaptured(url);
      return;
    }
    // A regex match on a known retailer's product-page URL is a stronger
    // signal than a weak local model's guess -- capture directly instead
    // of letting the AI override a confident match with a wrong "no".
    const info = extractProductInfo();
    await addToOutbox({ ...info, tags: [], capturedAt: new Date().toISOString() });
    await markUrlAsSeen(url);
    chrome.runtime.sendMessage({ type: 'syncNow' });
    return;
  }

  if (await hasSeenUrl(url)) {
    await bumpAlreadyCaptured(url);
    return;
  }

  const settings = await getSettings();
  const pageText = document.body.innerText.slice(0, 1500);

  let answer: string;
  try {
    answer = await askBackground(
      `Is this webpage a single product page on a shopping site (not a homepage, search results page, category listing, cart, or article)? Title: "${document.title}". URL: ${url}. Page excerpt: """${pageText}"""\n\nReply on the first line with exactly one word: YES or NO. If YES, add a second line with 3-5 short comma-separated tags describing the product (category, material, style, brand -- whatever's relevant).`,
      settings,
    );
  } catch (err) {
    console.warn('[lani] classify failed:', err instanceof Error ? err.message : String(err));
    return;
  }

  const [firstLine, tagsLine] = answer
    .trim()
    .split('\n')
    .map((line) => line.trim());

  // Small/weak local models don't always obey "reply with exactly one
  // word" -- they'll wrap it in markdown ("**YES**"), add a prefix
  // ("Answer: yes"), or add punctuation. Strip non-letters off the front
  // before checking instead of requiring an exact match.
  const normalizedFirstLine = (firstLine || '').replace(/^[^a-zA-Z]+/, '').toLowerCase();

  if (!normalizedFirstLine.startsWith('yes')) return;

  const tags = (tagsLine || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const info = extractProductInfo();
  await addToOutbox({ ...info, tags, capturedAt: new Date().toISOString() });
  await markUrlAsSeen(url);
  chrome.runtime.sendMessage({ type: 'syncNow' });
}

main().catch((err) => {
  console.warn('[lani] detect failed:', err instanceof Error ? err.message : String(err));
});
