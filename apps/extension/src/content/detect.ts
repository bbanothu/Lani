import { extractProductInfo } from '../lib/extract';
import { matchesKnownRetailer } from '../lib/site-patterns';
import {
  LLMSettings,
  getSettings,
  addToOutbox,
  isDomainKnownNonProduct,
  markDomainAsNonProduct,
  hasSeenUrl,
  markUrlAsSeen,
  addLog,
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

  const domain = window.location.hostname;
  const url = window.location.href;

  addLog(domain, `Checking ${url}`);

  // Known retailers (Amazon, eBay, etc.) get a URL-shape pre-filter instead
  // of the domain blacklist: those sites mix product pages with search/cart/
  // home pages under the same domain, so one "no" answer shouldn't silence
  // the whole site the way it's fine to for a domain we know nothing about.
  // A URL that doesn't match the known shape isn't necessarily NOT a
  // product page -- our regex guesses are incomplete -- so that case falls
  // through to the AI instead of being auto-skipped, same as any domain
  // we've never seen before.
  const knownPattern = matchesKnownRetailer(domain);

  if (knownPattern && knownPattern.test(url)) {
    if (await hasSeenUrl(url)) {
      addLog(domain, 'Skipped -- already captured this URL');
      return;
    }
    // A regex match on a known retailer's product-page URL is a stronger
    // signal than a weak local model's guess -- capture directly instead
    // of letting the AI override a confident match with a wrong "no".
    addLog(domain, 'Matches known product-page pattern for this site');
    const info = extractProductInfo();
    await addToOutbox({ ...info, tags: [], capturedAt: new Date().toISOString() });
    await markUrlAsSeen(url);
    addLog(domain, `Captured "${info.title}"`, 'success');
    chrome.runtime.sendMessage({ type: 'syncNow' });
    return;
  }

  if (!knownPattern && (await isDomainKnownNonProduct(domain))) {
    addLog(domain, 'Skipped -- domain is blacklisted');
    return;
  } else if (knownPattern) {
    addLog(domain, "URL doesn't match the known pattern for this site -- asking AI");
  }

  if (await hasSeenUrl(url)) {
    addLog(domain, 'Skipped -- already captured this URL');
    return;
  }

  const settings = await getSettings();
  const pageText = document.body.innerText.slice(0, 1500);

  addLog(domain, `Asking ${settings.provider} if this is a product page...`);

  let answer: string;
  try {
    answer = await askBackground(
      `Is this webpage a single product page on a shopping site (not a homepage, search results page, category listing, cart, or article)? Title: "${document.title}". URL: ${url}. Page excerpt: """${pageText}"""\n\nReply on the first line with exactly one word: YES or NO. If YES, add a second line with 3-5 short comma-separated tags describing the product (category, material, style, brand -- whatever's relevant).`,
      settings,
    );
  } catch (err) {
    addLog(
      domain,
      `Error calling ${settings.provider}: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    );
    return;
  }

  addLog(domain, `AI answered: "${answer.trim()}"`);

  const [firstLine, tagsLine] = answer
    .trim()
    .split('\n')
    .map((line) => line.trim());

  // Small/weak local models don't always obey "reply with exactly one
  // word" -- they'll wrap it in markdown ("**YES**"), add a prefix
  // ("Answer: yes"), or add punctuation. Strip non-letters off the front
  // before checking instead of requiring an exact match.
  const normalizedFirstLine = (firstLine || '').replace(/^[^a-zA-Z]+/, '').toLowerCase();

  if (!normalizedFirstLine.startsWith('yes')) {
    if (knownPattern) {
      addLog(domain, 'Not a product page');
    } else {
      addLog(domain, 'Not a product page -- blacklisting domain');
      await markDomainAsNonProduct(domain);
    }
    return;
  }

  const tags = (tagsLine || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const info = extractProductInfo();
  await addToOutbox({ ...info, tags, capturedAt: new Date().toISOString() });
  await markUrlAsSeen(url);
  addLog(domain, `Captured "${info.title}"`, 'success');
  chrome.runtime.sendMessage({ type: 'syncNow' });
}

main().catch((err) => {
  addLog(
    window.location.hostname,
    `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    'error',
  );
});
