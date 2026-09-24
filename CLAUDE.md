# Codex

A personal, self-refreshing visual archive of GitHub repos worth learning from.
Live site: https://seanjoudrie.github.io/Codex/

## When the user describes an idea

This is the main thing to help with. Pull references *before* giving advice:

1. Run `npm run ideas -- "<the idea in their words>"`. It ranks the archive (`data/index.json`)
   by relevance to the idea and usefulness, grouped by category.
2. Try two or three rephrasings too: the technical name for the thing, the visual effect,
   and the genre. Plain-language ideas often miss technical repo names on the first pass.
3. Read the READMEs of the top 3–6 hits (WebFetch `https://github.com/<repo>`). Understand
   *how* each one does it before you recommend it.
4. Answer with:
   - **Closest existing work:** what's already been built that looks like this, with links
   - **Best way to build it:** the technique or stack to use, and which repo to study for each part
   - **Hard part:** the one thing that will take the longest, and which reference solves it
   - **What would make it theirs:** where the idea goes beyond everything in the archive
5. If the archive is thin on the idea, say so, then run `prompts/scout.md` scoped to it
   (e.g. `categories: [game-ai]`, a few per category) and add what you find to `data/seeds.json`.

Licence doesn't filter the archive, but when you recommend *using code*, name the licence.
GPL means their project becomes GPL; no licence means all rights reserved.

## Idea generator

`site/ideas.html` + `site/ideas.js` combine building blocks from `data/features.json` into ideas.
When the user wants new kinds of blocks, add entries there: `kinds` (game, render, app, portfolio,
website, tool), `tags` matching the generator's answer values, pinned `repos` that exist in
`data/index.json`, and a `query` for live archive matches. Keep `hook` phrased to fit "…, where <hook>".

## Archive rules

- **Never delete a repo** from `data/index.json` or `data/seeds.json`. Weak entries rank last; they don't leave.
- Link collections (awesome-lists) are kept but flagged `list: true` and scored down.
- `scripts/rank.mjs` scores every repo 0–100 (`site/match.js → usefulness`) and ranks it inside each category.

## Pipeline

`discover → enrich → capture → tag → rank → build`. Runs daily at 09:00 UTC via
`.github/workflows/weekly.yml` (named "Refresh"). Discovery rebuilds the queue on Mondays.
Each run enriches up to 250 queued repos and screenshots them.

- `data/seeds.json`: hand-picked and scout-found repos (always included)
- `data/sources.json`: awesome-lists, topics, queries, people, random draws
- `data/candidates.json`: queue of found-but-not-yet-enriched repos (never truncated)
- `prompts/scout.md`: prompt for finding new repos; `prompts/idea.md`: the idea workflow for other assistants

Local checks: `node --check scripts/*.mjs`, then `npm run rank && npm run build && npx serve dist`.
The GitHub API may be blocked in sandboxes; the real pipeline runs in Actions.
