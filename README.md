# Fragrance Unlocked

Smell expensive. Pay honest.

## How it works

- `index.html`: the whole site. Tabs: Explore (landing page plus an endless shuffled feed), Search, Dupes, and Match me (quiz). Every fragrance and dupe has its own page (`#f/...`, `#d/...`) with main accords, a note pyramid and store links. Both / Men / Women switch and a light / dark button in the top bar.
- `accords.js`: works out main accords and note icons from each fragrance's notes.
- `data.json`: fragrances (gender, notes, dupes, similar, photo) and store search links.
- `functions/api/prices.js`: Cloudflare function that fetches live full-bottle prices from Arvella and Beauty House (public Shopify search), cached for 6 hours.
- `scripts/images.mjs`: fills each fragrance's product photo from the stores. Run `node scripts/images.mjs` after adding fragrances.

FragranceNet, Sephora and Ulta block bots, so those show as "Check price" links. Notes are entered by hand, since Fragrantica forbids scraping. Affiliate product feeds would cover the big stores and add licensed product photos.

## Develop

```bash
npm test
python -m http.server
```

## Add a fragrance

Add an entry to `fragrances` in `data.json`.
