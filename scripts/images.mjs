// Fills each fragrance's `image` in data.json with a store product photo. Run: node scripts/images.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { SHOPS, shop } from '../functions/api/prices.js';

const file = new URL('../data.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
for (const f of data.fragrances) {
  for (const [store, base] of Object.entries(SHOPS)) {
    const hit = await shop(store, base, `${f.brand} ${f.name}`, f.name, f.brand).catch(() => null);
    if (hit?.image) { f.image = hit.image; break; }
  }
  console.log(f.image ? 'ok  ' : 'none', f.name);
}
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
