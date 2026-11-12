# Fragrance Unlocked

One search for a fragrance: notes, dupes, similar scents, and links to every store.

Static site, no build. Open `index.html` through any web server (`python -m http.server`), or visit the GitHub Pages site.

## Add a fragrance

Add an entry to `fragrances` in `data.json`. Store search URLs live in `stores`.

## Not done yet

- **Live prices.** Sephora, Ulta and Fragrantica block scrapers and forbid scraping in their terms, and a static page can't fetch other sites anyway (CORS). The practical route is affiliate product feeds (FragranceNet, Sephora and Ulta all run affiliate programs) pulled by a scheduled GitHub Action into `prices` in `data.json`.
- **Notes from Fragrantica.** Same problem. Notes here are entered by hand; each card links to Fragrantica.
