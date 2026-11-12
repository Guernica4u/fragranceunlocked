// Shared by the page and the Cloudflare functions.
export const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const slug = f => norm(`${f.brand} ${f.name}`);
