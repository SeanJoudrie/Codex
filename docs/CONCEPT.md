# Concept

Origin: the *Creative-Coding Experiments — Master Doc* — 26 ideas, 91 repos, hand-ranked.
It worked, but it was a one-off. This project automates that research and keeps it going.

## Goals

- **See everything.** A wall of screenshots to browse for inspiration, grouped by category.
- **Keep growing.** A weekly refresh finds new repos without anyone curating.
- **Personal.** Public, but built for one reader. Favourites and collections are for you.

Non-goals: licence gatekeeping (licence is a tag, not a filter), ranking for other people,
completeness. "All of GitHub" isn't reachable — search caps at 1,000 results per query
and ~30 searches/min — so we cast many specific nets instead.

## Discovery sources

| Source | Why |
|---|---|
| Seeds | The Master Doc repos, guaranteed in |
| Awesome-lists | Pre-curated; highest signal per request |
| Topics per category | Repos that self-tag (`webgl`, `game-ai`, `procedural-generation`…) |
| Search queries | Specific techniques (`"monte carlo tree search" language:javascript`) |
| People | Their repos **and what they star** — Fogleman's stars beat any keyword search |
| Snowballing *(roadmap)* | GitHub links inside READMEs of repos already in the index |
| Star velocity *(roadmap)* | GH Archive / BigQuery: repos rising fast this week |

## Screenshot fallback chain

1. **Live demo** — homepage or GitHub Pages URL, headless Chromium, 4s settle, reject blank frames.
2. **README media** — first non-badge image or GIF.
3. **Social card** — `opengraph.githubassets.com`, always exists.
4. **Placeholder** — repo name on a category colour (rendered by the site).

Every card records which it used, so "Real screenshots first" sorting works.
Thumbnails are 600px WebP (~30–60 KB) → about 1,000 repos per 50 MB. If the repo gets heavy,
move `media/` to a separate branch or release assets.

WebGL on CI: `--use-angle=swiftshader --enable-unsafe-swiftshader` renders on CPU.
Heavy WebGPU demos will still fail and fall through to the README image.

## Categories

Motion & animation · Rendering & shaders · Simulation · Game AI · Algorithms, visualized ·
Procedural generation · Data viz & collection · Math · Interaction & UI · Audio ·
Design tooling · Random & wildcard — full list with hints in `data/categories.json`

## Record shape

```json
{
  "repo": "nicoptere/physarum",
  "url": "https://github.com/nicoptere/physarum",
  "description": "…", "homepage": "…", "language": "JavaScript", "topics": [],
  "stars": 321, "pushed": "2024-…", "licence": "Unlicense",
  "categories": ["simulation"], "idea": "Slime mold", "note": "JS physarum core",
  "technique": "Agent sense-rotate-move over a decaying trail texture",
  "readme_image": "https://…", "media": { "path": "media/nicoptere__physarum.webp", "kind": "demo" },
  "sources": ["seed", "starred-by:fogleman"], "first_seen": "2026-08-18"
}
```

## Site

- Masonry screenshot grid, search (`/` to focus), category chips with counts
- Sort: newest · most stars · hidden gems (real screenshot, few stars, recently pushed) · real screenshots first
- "New this week" strip
- Click → detail: screenshot, technique, idea, licence, where it was found, repo + demo links
- ★ favourites (browser-local for now)

## Roadmap

| # | Step | Status |
|---|---|---|
| 1 | Seeds → JSON with metadata | scaffolded |
| 2 | Screenshot capture + WebP thumbnails | scaffolded |
| 3 | Static grid site on Pages | scaffolded |
| 4 | Weekly cron + discovery | scaffolded |
| 5 | LLM technique lines + categories (`tag.mjs`) | stub |
| 6 | Hover clips (3s WebM for animated demos) | todo |
| 7 | Collections ("Cortex ingredients", "CPU opponent AI") in `data/collections.json` | todo |
| 8 | Snowballing + star velocity | todo |
| 9 | Re-capture stale demos; mark dead links | todo |
| 10 | "How I made X" pages from a `used_in` field | todo |

## Open questions

- Favourites: stay browser-local, or commit to the repo so they sync across devices?
- Hide list: a `data/hidden.json` for repos you never want to see again?
