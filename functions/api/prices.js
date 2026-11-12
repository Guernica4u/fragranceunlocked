// Live prices from stores whose public Shopify search is open to us.
// FragranceNet, Sephora and Ulta block bots, so the page links to them instead.
const SHOPS = {
  'Arvella': 'https://arvellafragrance.com',
  'Beauty House': 'https://www.beautyhouse.com',
};
const UA = 'Mozilla/5.0 (compatible; FragranceUnlocked/1.0; +https://fragranceunlocked.pages.dev)';

export function ml(title) {
  const m = title.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (m) return +m[1];
  const o = title.match(/(\d+(?:\.\d+)?)\s*oz/i);
  return o ? Math.round(o[1] * 29.5735) : 0;
}

// Largest full bottle (no testers, vials or minis): the size people compare on.
export function pick(variants) {
  return variants
    .filter(v => v.available !== false && !/tester|vial|sample|travel|mini|\bset\b/i.test(v.title))
    .map(v => ({ size: ml(v.title), price: +v.price }))
    .filter(v => v.size >= 30 && v.price > 0)
    .sort((a, b) => b.size - a.size || a.price - b.price)[0] || null;
}

async function shop(store, base, q, want) {
  const get = url => fetch(url, { headers: { 'user-agent': UA } }).then(r => r.ok ? r.json() : null);
  const s = await get(`${base}/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=5`);
  // shortcut: first result whose title contains the name; flankers ("Sauvage Elixir") can slip in. Upgrade: match on vendor + exact title.
  const hit = s?.resources?.results?.products?.find(p => p.title.toLowerCase().includes(want));
  if (!hit) return null;
  const p = await get(`${base}/products/${encodeURIComponent(hit.handle)}.json`);
  const best = p && pick(p.product.variants);
  return best && { store, ...best, url: `${base}/products/${encodeURIComponent(hit.handle)}` };
}

export async function onRequestGet({ request, waitUntil }) {
  const cached = await caches.default.match(request);
  if (cached) return cached;
  const u = new URL(request.url);
  const q = (u.searchParams.get('q') || '').slice(0, 100);
  const want = (u.searchParams.get('name') || '').toLowerCase().slice(0, 60);
  if (!q || !want) return Response.json({ error: 'q and name are required' }, { status: 400 });
  const prices = (await Promise.all(
    Object.entries(SHOPS).map(([store, base]) => shop(store, base, q, want).catch(() => null))
  )).filter(Boolean);
  const res = Response.json({ prices, checked: new Date().toISOString() },
    { headers: { 'cache-control': 'public, max-age=21600' } }); // 6 h
  waitUntil(caches.default.put(request, res.clone()));
  return res;
}
