# Curious City

A free, English-language Japan travel guide covering 10 destinations — Tokyo, Osaka, Kyoto, Yokohama, Nagoya, Kobe, Hiroshima, Fukuoka, Hokkaido, and Sendai — with over 1,000 hand-curated spots spanning sightseeing, food, nightlife, shopping, and more.

**Live site:** https://ytakakura0103-hash.github.io/japan-travel-guide/

## About this project

Curious City started as a monetized affiliate travel site and has since been repurposed as a portfolio piece. It isn't run as a business — there are no ads or affiliate links.

Every part of it — the 1,000+ structured spot entries, the site's data model, the page templates, the search UI, and the automated test suite — was built by directing [Claude Code](https://claude.com/claude-code) through the actual engineering work: planning the data schema, generating and reviewing content, writing and debugging the page-generation logic, and keeping tests green along the way. See [About](site/about.html) for the full story.

## Tech stack

- Vanilla HTML, CSS, and JavaScript (ES modules) — no framework, no client-side build step
- [Vitest](https://vitest.dev/) + [jsdom](https://github.com/jsdom/jsdom) for the test suite (66 tests across 11 files)
- Data-driven static site generation: spot pages and `sitemap.xml` are generated from a single `site/data/activities.json` dataset by a Node.js script, then committed as plain HTML
- Deployed to GitHub Pages via a GitHub Actions workflow that publishes the `site/` folder on every push to `master`

## Project structure

```
site/               the deployed site (this folder is what GitHub Pages serves)
  data/
    activities.json   the dataset every spot page is generated from
  src/                 pure, testable rendering/logic modules
  spots/               1,025 generated spot pages (not hand-written)
  styles/
scripts/
  generate-spot-pages.js   regenerates site/spots/ and site/sitemap.xml from activities.json
tests/                 Vitest test suite
```

## Development

```bash
npm test        # run the test suite
npm run build   # regenerate spot pages and sitemap.xml from activities.json
```
