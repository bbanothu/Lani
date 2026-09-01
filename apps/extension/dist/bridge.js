// Runs only on the website's own origin (see manifest.json matches).
// Product capture syncs directly from the background worker to Supabase
// now (see src/background/index.ts's syncOutbox) -- this file only relays
// the "open every cart tab" request, since browsers block multi window.open
// calls from a page but not from the extension.
window.__LANI_EXTENSION__ = true;

window.addEventListener('lani:open-tabs', (event) => {
  const urls = event.detail?.urls;
  if (!Array.isArray(urls) || urls.length === 0) return;
  chrome.runtime.sendMessage({ type: 'openTabs', urls });
});
