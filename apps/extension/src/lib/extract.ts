// Runs inside the browsed page (either injected via chrome.scripting, or
// directly as part of a content script) -- must stay self-contained, no
// references to anything outside this function, since chrome.scripting
// serializes it by source text.
export function extractProductInfo() {
  const domain = window.location.hostname;

  // Amazon's product pages don't reliably carry usable og:image/price meta
  // tags, so the generic path below grabs the wrong image/price there --
  // these element IDs have been stable on Amazon for years.
  if (domain.toLowerCase().split('.').includes('amazon')) {
    const title = document.querySelector('#productTitle')?.textContent?.trim() || document.title;

    const priceText =
      document.querySelector('.a-price .a-offscreen')?.textContent ||
      document.querySelector('#priceblock_ourprice')?.textContent ||
      document.querySelector('#priceblock_dealprice')?.textContent ||
      '';
    const priceMatch = priceText.match(/[$£€]\s?\d+(?:[.,]\d{2})?/);

    const image =
      (document.querySelector('#landingImage') as HTMLImageElement | null)?.src ||
      (document.querySelector('#imgTagWrapperId img') as HTMLImageElement | null)?.src ||
      null;

    return {
      title: title.slice(0, 200),
      price: priceMatch ? parseFloat(priceMatch[0].slice(1).replace(',', '')) : null,
      currency: priceMatch ? priceMatch[0][0] : '$',
      image,
      url: window.location.href,
      domain,
    };
  }

  const getMeta = (name: string) => {
    const el =
      document.querySelector(`meta[property="${name}"]`) ||
      document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute('content') : null;
  };

  const title = getMeta('og:title') || document.title;
  const image = getMeta('og:image');

  let price: number | null = null;
  let currency = '$';
  const priceMeta = getMeta('product:price:amount') || getMeta('og:price:amount');
  if (priceMeta) {
    price = parseFloat(priceMeta);
  } else {
    const match = document.body.innerText.match(/[$£€]\s?\d+(?:[.,]\d{2})?/);
    if (match) {
      currency = match[0][0];
      price = parseFloat(match[0].slice(1).replace(',', ''));
    }
  }

  return {
    title: (title || document.title).slice(0, 200),
    price,
    currency,
    image,
    url: window.location.href,
    domain,
  };
}
