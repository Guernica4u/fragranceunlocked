# Fragrance Unlocked

No secrets. Every price, every note, every dupe.

Live at https://fragranceunlocked.pages.dev

## How it works

- `index.html`: the whole site. Search covers names, notes and dupes. Click any note or dupe to search for it. Bottle art is drawn from each fragrance's scent families.
- `data.json`: fragrances (notes, dupes, similar) and store search links.
- `functions/api/prices.js`: Cloudflare function that fetches live full-bottle prices from Arvella and Beauty House (public Shopify search), cached for 6 hours.
- `scripts/images.mjs`: fills each fragrance's product photo from the stores. Run `node scripts/images.mjs` after adding fragrances.

FragranceNet, Sephora and Ulta block bots, so those show as "Check price" links. Notes are entered by hand, since Fragrantica forbids scraping. Affiliate product feeds would cover the big stores and add licensed product photos.

## Develop

```bash
npm test
npx wrangler pages dev .
```

## Deploy

Pushing to `main` deploys through GitHub Actions once the repo has a `CLOUDFLARE_API_TOKEN` secret (a Cloudflare API token with "Cloudflare Pages: Edit").

## Add a fragrance

Add an entry to `fragrances` in `data.json`.
