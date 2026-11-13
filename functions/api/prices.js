// Live prices (USD) from stores whose public Shopify search is open to us.
// Only shops that sell in USD go here: the page shows a $ sign on every price.
// FragranceNet, Sephora and Ulta block bots, so the page links to them instead.
// `brands`: a maker's own shop, only asked about its own fragrances (its vendor field says "Inspired by…", so no vendor check).
export const SHOPS = {
  'Arvella': { base: 'https://arvellafragrance.com' },
  'Beauty House': { base: 'https://www.beautyhouse.com' },
  'Perfumania': { base: 'https://www.perfumania.com' },
  'FragranceOutlet': { base: 'https://www.fragranceoutlet.com' },
  'Dossier': { base: 'https://www.dossier.co', brands: ['Dossier'] },
  'Alt. Fragrances': { base: 'https://www.altfragrances.com', brands: ['Alt. Fragrances'] },
  'Lattafa USA': { base: 'https://lattafa-usa.com', brands: ['Lattafa', 'Maison Alhambra'] },
  'Almanaar': { base: 'https://almanaar.co.uk' },
  'Emirates Oud': { base: 'https://emiratesoud.co.uk' },
  'Triple Traders': { base: 'https://tripletraders.com' },
  'Intense Oud': { base: 'https://www.intenseoud.com' },
  'Sensabeauty': { base: 'https://sensabeauty.com' },
  'Mazen Online': { base: 'https://www.mazenonline.com' },
  'DecantX': { base: 'https://www.decantx.com' },
};
const UA = 'Mozilla/5.0 (compatible; FragranceUnlocked/1.0; +https://github.com/Guernica4u/fragranceunlocked)';

export function ml(title) {
  const m = title.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (m) return +m[1];
  const o = title.match(/(\d+(?:\.\d+)?)\s*oz/i);
  return o ? Math.round(o[1] * 29.5735) : 0;
}

// The full bottle closest to 100 ml (3.4 oz), the size people compare on; no testers, vials or minis.
export function pick(variants) {
  return variants
    .filter(v => v.available !== false && !/tester|vial|sample|travel|mini|\bset\b/i.test(v.title))
    .map(v => ({ size: ml(v.title), price: +v.price }))
    .filter(v => v.size >= 30 && v.price > 0)
    .sort((a, b) => Math.abs(a.size - 100) - Math.abs(b.size - 100) || a.price - b.price)[0] || null;
}

// Title minus brand, concentration and size: "Creed Aventus Eau de Parfum for Men 3.4 oz" -> "aventus".
const FILLER = /\b(edp|edt|eau|de|parfum|perfume|perfumes|toilette|cologne|for|men|women|unisex|everyone|spray|natural|by|pour|homme|femme|tester|new|the|original|unboxed|fl|oz|ml)\b|\d+(\.\d+)?\s*(oz|ml)\.?|\b\d+\.\d+\b/g;
export function clean(title, brand = '') {
  const plain = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''); // "hermès" -> "hermes"
  const words = s => plain(s).replace(/[^\p{L}\p{N}\s.]/gu, ' ').replace(/\s+/g, ' ').trim();
  let t = words(title);
  const b = words(brand); // "Hermes Terre d'Hermes" keeps the second "hermes"; a brand named later ("... by Lattafa") is dropped too
  if (b && t.startsWith(b + ' ')) t = t.slice(b.length);
  if (b) t = ` ${t} `.split(` ${b} `).join(' ').trim();
  return t.replace(FILLER, ' ').replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
}

// Exact name match first so flankers ("Sauvage Elixir", "Aventus for Her") lose to the original.
// The store's brand (vendor) must agree when it lists one; partial matches must be whole words ("her" ≠ "hero").
const norm = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export function match(products, name, brand = '') {
  const want = clean(name, brand);
  const ours = products.filter(p => !brand || !p.vendor || norm(p.vendor).includes(norm(brand)) || norm(brand).includes(norm(p.vendor)));
  return ours.find(p => clean(p.title, brand) === want)
    || ours.find(p => ` ${clean(p.title, brand)} `.includes(` ${want} `) && !isFlanker(clean(p.title, brand), want)) || null;
}

// A partial match that adds one of these words is a different fragrance ("Stronger With You Intensely").
// Car diffusers, candles, gift sets and the like share a name with the fragrance but are not it.
const FLANKERS = new Set('intense intensely elixir absolu absolute extreme sport aqua platinum night noir tonic privee prive edition limited summer fraiche reserve candy tous moi exclusif exclusive room pcs pc piece pieces set pack duo trio combo car diffuser freshener candle soap deodorant shower lotion bundle kit gift sample decant vial'.split(' '));
const isFlanker = (title, want) => title.split(' ').some(w => FLANKERS.has(w) && !want.split(' ').includes(w));

export async function shop(store, { base, brands }, q, name, brand) {
  if (brands && !brands.some(b => norm(b) === norm(brand))) return null;
  // Stores throttle Cloudflare's IPs now and then: retry once, then throw so the result isn't cached.
  const get = async url => {
    for (let i = 0; i < 2; i++) {
      const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
      if (r.ok) return r.json();
      if (r.status === 404) return null;
      await new Promise(ok => setTimeout(ok, 400));
    }
    throw new Error(`${store} unavailable`);
  };
  const s = await get(`${base}/search/suggest.json?q=${encodeURIComponent(brands ? name : q)}&resources[type]=product&resources[limit]=10`);
  const hit = match(s?.resources?.results?.products || [], name, brands ? '' : brand);
  if (!hit) return null;
  const p = await get(`${base}/products/${encodeURIComponent(hit.handle)}.json`);
  // Some shops leave the size out of the variant ("Default Title") and only put it in the product title.
  const best = p && pick(p.product.variants.map(v => ({ ...v, title: /\d/.test(v.title) ? v.title : p.product.title })));
  return best && { store, ...best, url: `${base}/products/${encodeURIComponent(hit.handle)}`, image: hit.image || null };
}

export async function onRequestGet({ request, waitUntil }) {
  const cached = await caches.default.match(request);
  if (cached) return cached;
  const u = new URL(request.url);
  const q = (u.searchParams.get('q') || '').slice(0, 100);
  const name = (u.searchParams.get('name') || '').slice(0, 60);
  const brand = (u.searchParams.get('brand') || '').slice(0, 60);
  if (!q || !name) return Response.json({ error: 'q and name are required' }, { status: 400 });
  let failed = false;
  const prices = (await Promise.all(
    Object.entries(SHOPS).map(([store, cfg]) => shop(store, cfg, q, name, brand).catch(() => { failed = true; return null; }))
  )).filter(Boolean);
  const res = Response.json({ prices, checked: new Date().toISOString() },
    { headers: { 'cache-control': failed ? 'no-store' : 'public, max-age=21600' } }); // 6 h when complete
  if (!failed) waitUntil(caches.default.put(request, res.clone()));
  return res;
}
