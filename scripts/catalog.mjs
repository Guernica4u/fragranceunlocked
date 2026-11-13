// Fast candidate finder over the public Shopify product feeds of the shops in SHOPS below.
//   node scripts/catalog.mjs fetch                      download every feed once into the cache (outside the repo)
//   node scripts/catalog.mjs find <word>                 list matching listings: store, price, photo, notes, link
//   node scripts/catalog.mjs candidates <Brand>...       one line per fragrance that has a full top/heart/base list
//                                                        in its listing, with photo and link (JSON, for review)
// Only explicit "Top notes ... Heart/Middle notes ... Base notes ..." text counts. Prose is never parsed into notes.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SHOPS = {
  'Arvella': 'https://arvellafragrance.com',
  'Beauty House': 'https://www.beautyhouse.com',
  'Perfumania': 'https://www.perfumania.com',
  'FragranceOutlet': 'https://www.fragranceoutlet.com',
  'Dossier': 'https://www.dossier.co',
  'Alt. Fragrances': 'https://www.altfragrances.com',
  'Lattafa USA': 'https://lattafa-usa.com',
};
const CACHE = process.env.CATALOG_CACHE || join(tmpdir(), 'fragrance-catalog');
const UA = 'Mozilla/5.0 (compatible; FragranceUnlocked/1.0)';
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
    if (r.ok) return r.json();
    if (r.status === 404) return null;
    await sleep(800 * (i + 1));
  }
  throw new Error('failed: ' + url);
}

async function fetchAll() {
  mkdirSync(CACHE, { recursive: true });
  for (const [store, base] of Object.entries(SHOPS)) {
    const all = [];
    for (let page = 1; ; page++) {
      const list = (await getJson(`${base}/products.json?limit=250&page=${page}`))?.products || [];
      all.push(...list);
      if (list.length < 250) break;
      await sleep(300);
    }
    writeFileSync(join(CACHE, slug(store) + '.json'), JSON.stringify(all));
    console.log(store.padEnd(18), String(all.length).padStart(6), 'products');
  }
}

// Listing text with tags stripped, one line per paragraph.
export function plainText(html = '') {
  return html.replace(/<br\s*\/?>|<\/(p|li|div|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n');
}

// Explicit tiers only: all three must be stated. Returns null otherwise.
export function explicitNotes(html = '') {
  const t = plainText(html);
  const cut = '(?=\\s*(?:[;.\\n]|\\b(?:top|heart|middle|base)\\s+notes?\\b|$))';
  const grab = re => (t.match(re)?.[1] || '').trim();
  const top = grab(new RegExp('top\\s+notes?\\s*(?:are|:|-)\\s*([^\\n]+?)' + cut, 'i'));
  const heart = grab(new RegExp('(?:heart|middle)\\s+notes?\\s*(?:are|:|-)\\s*([^\\n]+?)' + cut, 'i'));
  const base = grab(new RegExp('base\\s+notes?\\s*(?:are|:|-)\\s*([^\\n]+?)' + cut, 'i'));
  if (!top || !heart || !base) return null;
  // Drops family words ("Woody Notes"), lone origins ("Calabrian") and anything that is not a single note name.
  const GENERIC = /\bnotes?\b|^(woody|woodsy|spicy|herbal|green|fruity|floral|citrus|nutty|ozonic|sweet|fresh|aromatic|marine|calabrian|sicilian|italian|bulgarian|indian|egyptian|turkish|moroccan|madagascan|madagascar|french|persian)$/i;
  const list = s => s.split(/\s*,\s*|\s+and\s+|\s*&\s*/i).map(x => x.replace(/\(.*?\)/g, '').trim())
    .filter(x => x && !GENERIC.test(x) && x.split(' ').length <= 4 && /^[\p{L}][\p{L}' -]*$/u.test(x))
    .map(x => x.replace(/\b\w/g, c => c.toUpperCase())).slice(0, 5);
  const out = { top: list(top), heart: list(heart), base: list(base) };
  return out.top.length && out.heart.length && out.base.length ? out : null;
}

function products() {
  const out = [];
  for (const file of readdirSync(CACHE).filter(f => f.endsWith('.json'))) {
    const store = file.replace(/\.json$/, '');
    const base = Object.entries(SHOPS).find(([s]) => slug(s) === store)?.[1];
    for (const p of JSON.parse(readFileSync(join(CACHE, file), 'utf8'))) out.push({ store, base, ...p });
  }
  return out;
}

const price = p => {
  const v = (p.variants || []).filter(x => x.available !== false).map(x => +x.price).filter(x => x > 0);
  return v.length ? Math.min(...v) : 0;
};
const url = p => `${p.base}/products/${p.handle}`;
const photo = p => p.images?.[0]?.src || null;

function find(term) {
  const t = norm(term);
  const hits = products().filter(p => norm(p.vendor || '').includes(t) || norm(p.title).includes(t));
  for (const p of hits) {
    const n = explicitNotes(p.body_html);
    console.log([p.store.padEnd(15), p.title.slice(0, 60).padEnd(60), price(p) ? '$' + price(p).toFixed(2) : '-',
      photo(p) ? 'img' : 'no-img', n ? 'notes' : '-', url(p)].join(' | '));
  }
  console.log(hits.length, 'matches');
}

// Title minus brand, size and concentration, keeping the original spelling: "Creed Aventus Eau de Parfum for Men 3.4 oz" -> "Aventus".
const CONC = /\b(extrait de parfum|eau de parfum|eau de toilette|eau de cologne|edp|edt|edc)\b/gi; // "Cologne", "Parfum", "Intense" can be part of a name
const GENDER = /\b(for (men|women|him|her|everyone|unisex|men and women)|pour (homme|femme)|unisex)\b/gi;
const SIZE = /\b\d+(\.\d+)?\s*(ml|oz|fl\.?\s*oz)\b\.?/gi;
const JUNK = /deodorant|body|hair|mist|air freshener|bundle|gift|\bset\b|vial|sample|travel|mini|decant|tester|\boil\b|roll|soap|shower|candle|lotion|cream|\bpcs?\b|piece|\bkit\b|combo|\bduo\b|trio|refill|discovery|\bpack\b|sprayer|miniature/i;

function nameOf(title, brand) {
  let s = title.replace(new RegExp('^\\s*' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), '').replace(/^\s*(&|and)\s*\S+\s+/i, ''); // "Dolce & Gabbana X" -> "X"
  s = s.replace(SIZE, ' ').replace(CONC, ' ').replace(GENDER, ' ').replace(/[|()\-–,]+/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function genderOf(title, p) {
  const s = (title + ' ' + (p.tags || []).join(' ')).toLowerCase();
  if (/unisex|for everyone|men and women/.test(s)) return 'unisex';
  if (/for women|pour femme|for her|\bwomen\b/.test(s) && !/for men|pour homme|for him|\bmen\b/.test(s)) return 'women';
  if (/for men|pour homme|for him|\bmen\b/.test(s) && !/for women|pour femme|for her|\bwomen\b/.test(s)) return 'men';
  return null;
}

function candidates(brands) {
  const byKey = new Map();
  for (const p of products()) {
    const brand = brands.find(b => norm(p.vendor || '').startsWith(norm(b)) || norm(p.title).startsWith(norm(b)));
    if (!brand || JUNK.test(p.title)) continue;
    const notes = explicitNotes(p.body_html);
    const ph = photo(p);
    if (!notes || !ph) continue;
    const name = nameOf(p.title, brand);
    const gender = genderOf(p.title, p);
    if (!name || !gender) continue;
    const key = norm(brand) + '|' + norm(name);
    const c = { brand, name, gender, notes, source: url(p), image: ph, store: p.store };
    if (!byKey.has(key)) byKey.set(key, c);
  }
  return [...byKey.values()];
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'fetch') await fetchAll();
else if (cmd === 'find') find(rest.join(' '));
else if (cmd === 'candidates') console.log(JSON.stringify(candidates(rest), null, 1));
else console.log('usage: node scripts/catalog.mjs fetch | find <word> | candidates <Brand>...');
