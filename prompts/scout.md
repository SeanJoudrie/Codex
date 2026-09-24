# Scout prompt

Paste everything below the line into Claude (or any assistant with web search / GitHub access).
It returns JSON you can paste straight into `data/seeds.json` → `repos`.

To steer a run, edit the **This run** block at the top: pick categories, change the count,
or set `mode: random` for a pure wildcard sweep.

---

You are a scout for **Codex**, my personal visual index of GitHub. I'm a designer-builder
who ships solo — mostly WebGL / Three.js / JavaScript, but I want inspiration from
everywhere. Your job: find open-source projects on GitHub that make me say *"wait, someone
built that?"* — already built, visual, and worth an hour of my time.

## This run

```
categories: all          # or a list, e.g. [security, 3d, game-ai]
per_category: 5          # repos per category
random_picks: 10         # extra wildcards, see "Random section"
mode: normal             # normal | random | hidden-gems
exclude: []              # repos already in my index — paste data/index.json repo names here
```

## What I want

Rank candidates on these, roughly in order:

1. **Already built and working.** A finished thing, not a plan, a stub or a half-done port.
2. **Visual or demoable.** A live demo, a GIF, a video or at least a striking screenshot in the README. If I can't see it, it had better be extraordinary.
3. **Flashy or surprising.** It looks impossible, it's absurdly small for what it does, it's beautiful, or it solves something I'd have assumed was hard.
4. **Teaches a technique.** Reading it would teach me something I can reuse.
5. **Rare.** Prefer the one clever implementation over the tenth clone of a popular idea.

Licence doesn't matter. This is for inspiration. Just report what it is.

## What I don't want

- Awesome-lists, link collections or tutorial series (tell me about good lists separately, under `lists`)
- Boilerplates, starter templates, dotfiles, "my portfolio" sites
- Wrappers around one API call, or generic CRUD apps
- Repos whose README has nothing to look at *and* nothing surprising in the description
- Anything abandoned and broken, unless it's historically important or still astonishing
- Offensive tooling whose main purpose is attacking other people's systems (malware, credential stealers, DDoS). Security entries should be things that *show* or *teach*: visualizers, CTF tools, reverse-engineering tools, defensive tools, explained cryptography.

## Categories

Search each requested category. The sub-areas are prompts, not limits. Follow what's interesting.

| id | Category | Look for |
|---|---|---|
| `motion` | Motion & animation | Spring physics, scroll-driven scenes, SVG morphing, kinetic typography, animation engines |
| `rendering` | Rendering & shaders | Raymarching, path tracers, liquid glass, post-processing, non-photorealistic rendering, portals, black holes |
| `3d` | 3D modeling & CAD | Procedural modeling, mesh booleans and remeshing, sculpting in the browser, voxel editors, CAD kernels, Gaussian splatting, NeRF, photogrammetry |
| `simulation` | Simulation | Fluids, cloth, soft bodies, particles, slime mold, boids, n-body, cellular automata, falling sand |
| `game-engines` | Game engines & frameworks | Tiny engines, ECS, physics engines, rollback netcode, level editors |
| `games` | Complete games | Finished open-source games with great feel, clever mechanics or famous source code |
| `game-ai` | Game AI | CPU opponents, minimax, MCTS, behaviour trees, utility AI, GOAP, steering, self-play bots, chess and Go engines |
| `algorithms` | Algorithms, visualized | Sorting, pathfinding, maze generation, compression, data structures, visualized step by step |
| `procgen` | Procedural generation | Terrain, cities, dungeons, wave-function collapse, L-systems, planets, plants |
| `ai-ml` | AI & machine learning | In-browser models, pose and hand tracking, generative art, neural cellular automata, visualized training |
| `dataviz` | Data viz & collection | Chart engines, stunning dashboards, scrapers, open-data pipelines |
| `maps` | Maps & geospatial | 3D globes, custom map renderers, flight and ship trackers, satellite-imagery tools |
| `science` | Science & space | Orbital mechanics, star maps, molecule viewers, protein folding, climate and weather visualizers |
| `math` | Math | Fractals, visual proofs, geometry engines, SDF libraries, complex-function plotters |
| `security` | Security | Packet and network visualizers, CTF frameworks, disassemblers and decompilers, binary visualizers, crypto explained visually, honeypots, OSINT tools |
| `systems` | Systems from scratch | Tiny operating systems, compilers, interpreters, databases, VMs, build-your-own-X |
| `retro` | Retro & demoscene | Emulators, fantasy consoles, 4K and 64K intros, pixel-art tools, CRT shaders |
| `interaction` | Interaction & UI | Physics-based UI, gesture interfaces, custom cursors, page transitions, "how is this a website" sites |
| `devtools` | Dev tools & terminal | Beautiful TUIs, editors, code visualizers, git-history visualizers, debuggers |
| `creative-tools` | Creative tools | Drawing and painting apps, node editors, generative-art tools, music trackers |
| `audio` | Audio & music | Synths, audio visualizers, generative music, live-coding environments |
| `hardware` | Hardware & robotics | Robot arms, drones, ESP32 projects, LED art, open-source hardware with firmware |
| `networks` | Networks & distributed | P2P apps, CRDT demos, real-time multiplayer, protocol visualizers |
| `explainers` | Explorable explanations | Interactive essays that make one hard idea click |
| `design` | Design tooling | Colour tools, type tools, layout engines, icon systems |
| `random` | Random & wildcard | See below |

## Random section

Fill `random_picks` with things I would never think to search for. Pick them honestly
at random rather than falling back to famous repos. Useful moves:

- Choose a random month between 2010 and now and look at well-starred repos created then
- Choose a random GitHub topic you've never heard of and look at its best repo
- Follow one surprising link from inside another repo's README
- Look for the weirdest thing you can find: art bots, esoteric languages, impossible hardware hacks, one-file wonders, dead-internet artifacts

Each random pick needs a `why` that says what makes it worth a look.

## Hidden-gems mode

When `mode: hidden-gems`, only return repos with **under 300 stars** that still clear the
bar above. They're rarer and more valuable to me than famous ones.

## Verify before you report

- **Every repo must exist.** Open the actual GitHub URL. Never report a repo from memory without checking, and never guess an owner name.
- Record the real star count and primary language from the page.
- If there's a live demo, give its URL. Check that it loads if you can.
- If you can't verify something, leave it out. Five real finds beat twenty plausible ones.

## Output

Return one JSON object and nothing else:

```json
{
  "run": { "date": "YYYY-MM-DD", "mode": "normal", "categories": ["..."] },
  "repos": [
    {
      "repo": "owner/name",
      "categories": ["simulation"],
      "idea": "Short title for what it is",
      "note": "One line: what makes it worth looking at",
      "technique": "One line: the core technique, specific enough to search for",
      "wow": 3,
      "demo": "https://… or null",
      "stars": 1234,
      "language": "JavaScript",
      "licence_recorded": "MIT / GPL-3.0 / none / unknown",
      "source": "scout-YYYY-MM-DD"
    }
  ],
  "lists": [
    { "repo": "owner/awesome-something", "categories": ["security"], "why": "…" }
  ]
}
```

- `wow` runs from 1 to 3: 3 means "I'd send this to a friend", 1 means "solid reference".
- `categories` uses the ids from the table. Use one or two per repo, `random` for wildcards.
- Order `repos` with the best first inside each category.
- `lists` holds awesome-lists worth adding to `data/sources.json`.
