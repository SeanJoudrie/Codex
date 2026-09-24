# Codex

A personal, self-refreshing **visual index of GitHub**: animation, shaders, simulations,
game AI, algorithms, procedural generation, data viz — anything worth stealing an idea from.
Every repo gets a screenshot. Every day it adds up to 250 more; every Monday it goes looking for new ones.

It's an inspiration library, not a curated recommendation list: everything goes in, the
licence is shown as a tag, and you decide later what's worth building on.

## How it works

```
discover  →  enrich  →  capture  →  tag  →  build
 sources      GitHub API   screenshots  LLM     static site → GitHub Pages
```

| Step | Script | What it does |
|---|---|---|
| Discover | `scripts/discover.mjs` | Pulls candidates from seeds, awesome-lists, topics, search queries and people you follow (their repos **and their stars**). Config: `data/sources.json` |
| Enrich | `scripts/enrich.mjs` | Stars, language, licence, homepage/demo, topics, first README image → `data/index.json` |
| Capture | `scripts/capture.mjs` | One 600px WebP per repo: **live demo screenshot → README image/GIF → GitHub social card**. WebGL renders via SwiftShader on CPU |
| Tag | `scripts/tag.mjs` | *(roadmap)* LLM writes a one-line technique summary and picks categories |
| Build | `scripts/build.mjs` | Copies `site/`, data and media into `dist/` |

The daily GitHub Action (`.github/workflows/weekly.yml`, named "Refresh") runs all five, commits new data
and screenshots, and deploys the site.

## Run it locally

```bash
npm install
npx playwright install chromium
export GITHUB_TOKEN=ghp_...   # any token; raises the API limit from 60 to 5,000/hr
npm run refresh               # full pipeline
npm run serve                 # open the site
```

`npm run build && npx serve dist` previews the site without hitting the network.

## Set up on GitHub

1. Push this folder to a new public repo.
2. **Settings → Pages → Source: GitHub Actions.**
3. **Actions → Refresh → Run workflow** for the first fill. After that it runs daily at 09:00 UTC.

## Files

```
data/
  seeds.json        91 repos from the Creative-Coding Experiments Master Doc
  sources.json      where discovery looks: awesome-lists, topics, queries, people
  categories.json   26 categories shown as filter chips
  index.json        the index itself (starts as seed stubs; the first refresh fills it)
  candidates.json   queue of discovered repos not yet enriched
media/              thumbnails, one .webp per repo
site/               the static front-end (grid, search, filters, ★ favourites)
docs/CONCEPT.md     the full plan and roadmap
docs/SOURCES.md     the seed list, readable
prompts/scout.md    the scout prompt
```

## Scouting with a prompt

`prompts/scout.md` is a prompt for Claude (or any assistant with web search) that hunts for
flashy, already-built projects across all 26 categories, including a **random & wildcard**
section. Set the categories, count and mode at the top, run it, and paste the `repos` it returns
into `data/seeds.json`. The next refresh screenshots them.

## Adding things by hand

- **A repo:** add it to `data/seeds.json`.
- **A source:** add an awesome-list, topic, query or GitHub username to `data/sources.json`.
- **A category:** add it to `data/categories.json`.
