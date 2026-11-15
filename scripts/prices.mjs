// Price snapshot: download each store's whole catalogue once (Shopify /products.json, 250 per page),
// match every fragrance offline with the same rules as /api/prices, and write prices.json.
// Far gentler than asking every store per fragrance: about a thousand requests in total.
// Run: node scripts/prices.mjs   (a GitHub Action runs it daily)
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { SHOPS, match, pick } from '../functions/api/prices.js';
import { slug } from '../shared.js';

const UA = 'Mozilla/5.0 (compatible; FragranceUnlocked/1.0; +https://github.com/Guernica4u/fragranceunlocked)';
const wait = ms => new Promise(ok => setTimeout(ok, ms));
async function get(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } }).catch(() => null);
    if (r?.ok) return r.json().catch(() => null);
    if (r && r.status !== 429 && r.status < 500) return null;
    await wait(2000 * (i + 1)); // throttled or down: back off
  }
  return null;
}

// Catalogues are cached in .cache/ for a day, so re-matching after a data change makes no requests.
const CACHE = new URL('../.cache/', import.meta.url);
mkdirSync(CACHE, { recursive: true });
async function catalogue(base) {
  const file = new URL(`catalog-${new URL(base).hostname}.json`, CACHE);
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < 864e5) return JSON.parse(readFileSync(file, 'utf8'));
  const res = await download(base);
  writeFileSync(file, JSON.stringify(res));
  return res;
}
async function download(base) {
  const cart = await get(`${base}/cart.js`);
  if (cart?.currency && cart.currency !== 'USD') return { skipped: cart.currency };
  const all = [];
  for (let page = 1; page <= 200; page++) {
    const j = await get(`${base}/products.json?limit=250&page=${page}`);
    const list = j?.products || [];
    all.push(...list);
    if (list.length < 250) break;
    await wait(400);
  }
  return { products: all };
}

const norm = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const data = JSON.parse(readFileSync(new URL('../data.json', import.meta.url), 'utf8'));
const out = {};
const per = {};
for (const [store, { base, brands }] of Object.entries(SHOPS)) {
  const { products = [], skipped } = await catalogue(base);
  if (skipped) { console.log(store, 'skipped:', skipped); continue; }
  // Group by vendor once so each fragrance only scans its own brand's products.
  const byVendor = new Map();
  for (const p of products) {
    const k = norm(p.vendor || '');
    byVendor.set(k, [...(byVendor.get(k) || []), p]);
  }
  let hits = 0;
  for (const f of data.fragrances) {
    if (brands && !brands.some(b => norm(b) === norm(f.brand))) continue;
    const b = norm(f.brand);
    const pool = brands ? products
      : [...byVendor].filter(([v]) => !v || v.includes(b) || b.includes(v)).flatMap(([, ps]) => ps);
    const hit = match(pool, f.name, brands ? '' : f.brand);
    const best = hit && pick(hit.variants.map(v => ({ ...v, title: /default title/i.test(v.title) ? hit.title : v.title })));
    if (!best) continue;
    (out[slug(f)] ||= []).push({ store, ...best, url: `${base}/products/${hit.handle}` });
    hits++;
  }
  per[store] = `${products.length} products, ${hits} matched`;
  console.log(store.padEnd(18), per[store]);
}
writeFileSync(new URL('../prices.json', import.meta.url), JSON.stringify({ updated: new Date().toISOString(), prices: out }) + '\n');
console.log(`priced ${Object.keys(out).length} of ${data.fragrances.length} fragrances`);
