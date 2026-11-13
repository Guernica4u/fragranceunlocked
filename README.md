# Fragrance Unlocked

Smell expensive. Pay honest.

## How it works

- `index.html`: the whole site. Two looks, swapped by the button in the top bar: `editorial.css` (default) and `classic.css`. Tabs: Explore (landing page, search, top-rated row, endless shuffled feed), Dupes (type any fragrance to see what it dupes or what dupes it) and Match me (quiz). Every fragrance, dupes included, has its own page (`#f/...`) with main accords, notes, star rating, store links and similar scents. Both / Men / Women switch and a light / dark button in the top bar.
- `data.json`: fragrances (gender, notes, dupes, `dupeOf`, similar, photo, notes source) and store search links.
- `accords.js`: works out main accords from each fragrance's notes.
- `shared.js`: slug helper shared by the page and the functions.
- `functions/api/prices.js`: live prices (USD) for the bottle closest to 100 ml / 3.4 oz, from Arvella, Beauty House, Perfumania, FragranceOutlet, and the makers' own shops for Dossier, Alt. Fragrances and Lattafa / Maison Alhambra (public Shopify search), cached 6 hours.
- `functions/api/ratings.js`: 1-5 star ratings, one vote per visitor per fragrance.
- `scripts/images.mjs`: fills missing product photos from the stores. Run `node scripts/images.mjs` after adding fragrances.

Notes are entered by hand from brand and store listings (each dupe links its source). Nothing is scraped from Fragrantica: its terms forbid it. FragranceNet, Sephora and Ulta block bots, so those show as "See price" links.

## Cloudflare Pages setup

1. Connect this repo. No build command; output directory `/`.
2. Create a KV namespace and bind it to the project as `RATINGS` (Settings → Bindings). Without it the site works, but star ratings stay hidden.

## Develop

```bash
npm test
npx wrangler pages dev . --kv RATINGS
```

## Add a fragrance

Add an entry to `fragrances` in `data.json`. For a dupe, set `dupeOf` to the original's "Brand Name" and add the dupe's name to the original's `dupes`.
