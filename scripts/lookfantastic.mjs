// Harvests Lookfantastic product pages for the given search queries and prints their name, notes (only if all three tiers are stated) and photo.
// Usage: node harvest_lf.mjs "jo malone cologne" "jo malone cologne intense" ...
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const curl = url => execFileSync('curl', ['-sL', '-m', '40', '-A', UA, url], { encoding: 'utf8', maxBuffer: 1 << 26 });
const decode = s => s.replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

const GENERIC = /\bnotes?\b|^(woody|woodsy|spicy|herbal|green|fruity|floral|citrus|nutty|ozonic|sweet|fresh|aromatic|marine|calabrian|sicilian|italian|bulgarian|indian|egyptian|turkish|moroccan|madagascan|madagascar|french|persian)$/i;
export function explicitNotes(html) {
  const t = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|li|div|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/[ \t]+/g, ' ');
  const cut = '(?=\\s*(?:[;.\\n]|\\b(?:top|heart|middle|base)\\s+notes?\\b|$))';
  const grab = re => (t.match(re)?.[1] || '').trim();
  const top = grab(new RegExp('top\\s+notes?\\s*(?:are|:|-)\\s*([^\\n]+?)' + cut, 'i'));
  const heart = grab(new RegExp('(?:heart|middle)\\s+notes?\\s*(?:are|:|-)\\s*([^\\n]+?)' + cut, 'i'));
  const base = grab(new RegExp('base\\s+notes?\\s*(?:are|:|-)\\s*([^\\n]+?)' + cut, 'i'));
  if (!top || !heart || !base) return null;
  const list = s => s.split(/\s*,\s*|\s+and\s+|\s*&\s*/i).map(x => x.replace(/\(.*?\)/g, '').trim())
    .filter(x => x && !GENERIC.test(x) && x.split(' ').length <= 4 && /^[\p{L}][\p{L}' -]*$/u.test(x))
    .map(x => x.replace(/^and\s+/i, '').replace(/\b\w/g, c => c.toUpperCase())).slice(0, 5);
  const out = { top: list(top), heart: list(heart), base: list(base) };
  return out.top.length && out.heart.length && out.base.length ? out : null;
}

const ids = new Map();
for (const q of process.argv.slice(2)) {
  const html = curl('https://www.lookfantastic.com/search?q=' + encodeURIComponent(q));
  for (const m of html.matchAll(/href="\/p\/([^"?]*?)\/(\d{6,})\/?(?:\?[^"]*)?"/g)) ids.set(m[2], `https://www.lookfantastic.com/p/${m[1]}/${m[2]}/`);
}
console.error('product ids', ids.size);
const rows = [];
for (const [id, url] of ids) {
  let html = '';
  try { html = curl(url); } catch { continue; }
  const title = decode((html.match(/<title>([^<]*)<\/title>/i)?.[1] || '').replace(/\s*\|\s*LOOKFANTASTIC.*$/i, '').trim());
  const image = (html.match(/property="og:image"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:image"/i) || [])[1] || null;
  rows.push({ id, url, title, image, notes: explicitNotes(html) });
  process.stderr.write('.');
}
console.error('');
writeFileSync(process.env.TEMP + '/lf_harvest.json', JSON.stringify(rows, null, 1));
for (const r of rows) console.log([r.id, (r.title || '').slice(0, 70).padEnd(70), r.notes ? 'NOTES' : '-', r.image ? 'img' : 'no-img'].join(' | '));
