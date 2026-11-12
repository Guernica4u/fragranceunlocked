// 1-5 star ratings, stored in Workers KV (bind a namespace as RATINGS in Cloudflare Pages settings).
// One vote per visitor (IP) per fragrance; voting again replaces the old vote.
// shortcut: all totals live in one KV key, so two votes landing in the same moment can lose one. Upgrade to D1 if traffic grows.
import { slug as slugOf } from '../../shared.js';

const TOTALS = 'totals';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

async function voterKey(request, slug) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${slug}|${ip}`)); // IPs are never stored
  return `v:${slug}:` + [...new Uint8Array(hash)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ env }) {
  if (!env.RATINGS) return json({ error: 'ratings not set up' }, 503);
  return json(await env.RATINGS.get(TOTALS, 'json') || {});
}

export async function onRequestPost({ request, env }) {
  if (!env.RATINGS) return json({ error: 'ratings not set up' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400); }
  const slug = String(body?.slug || '');
  const stars = Number(body?.stars);
  if (!/^[a-z0-9-]{1,100}$/.test(slug) || !Number.isInteger(stars) || stars < 1 || stars > 5) return json({ error: 'bad vote' }, 400);
  const data = await env.ASSETS.fetch(new URL('/data.json', request.url)).then(r => r.json());
  if (!data.fragrances.some(f => slugOf(f) === slug)) return json({ error: 'unknown fragrance' }, 404);

  const key = await voterKey(request, slug);
  const before = Number(await env.RATINGS.get(key)) || 0;
  const totals = await env.RATINGS.get(TOTALS, 'json') || {};
  const t = totals[slug] || { sum: 0, count: 0 };
  t.sum += stars - before;
  if (!before) t.count += 1;
  totals[slug] = t;
  await env.RATINGS.put(key, String(stars));
  await env.RATINGS.put(TOTALS, JSON.stringify(totals));
  return json({ slug, ...t });
}
