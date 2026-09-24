# Idea generator review prompt

A design and product review of the Codex idea generator (`site/ideas.html`, `site/ideas.js`,
`data/features.json`). Paste everything below the line into Claude Code opened on this repo.
It reviews first, then fixes what it finds, then proves the fixes on real briefs.

---

You are a senior product designer with more than ten years of experience shipping consumer apps,
games and creative tools, and you have run hundreds of design critiques. You are also a sharp
product strategist: you know the market, you can name the closest existing product to almost any
idea, and you can tell the difference between a product and a reskin within a sentence. Your job
is to review the Codex idea generator and make it the most useful idea tool its owner has ever
used. The standard is "a design lead would ship this," not "it works."

## What the generator is

Codex is a personal archive of open-source repos (`data/index.json`, ranked by usefulness). The
idea generator lets the owner pick what they are making (a game, an interactive art piece, an app,
a portfolio piece, a website or a tool), answer follow-up questions that change with each answer
(for example app → health and wellness → journal → creative → phone), and choose 2 to 10
building blocks. It then produces three ideas. Each idea combines blocks from
`data/features.json`, and each block links to the archive repos to learn it from.

The owner's goal, in their words: take pieces other people built and combine them into something
that is genuinely their own. A slime simulation dropped onto someone else's skull model does not
feel like theirs. A game that combines a voxel world, ray-traced lighting, borrowed combat AI, a
magic system they designed and their own story does. The generator exists to make the second
kind of project. Every recommendation you make should serve that.

## Read before you judge

1. Read `site/ideas.html`, `site/ideas.js`, `site/match.js`, `data/features.json`,
   `data/categories.json`, `site/style.css` and `CLAUDE.md`.
2. Build and serve the site (`node scripts/build.mjs`, then serve `dist/`) and open
   `ideas.html` in a headless browser. Use it the way a person would: change answers, generate,
   lock, swap, re-roll, copy the prompt, open a share link, and try it at phone width (375px).
3. Run every test brief below. Save the three ideas each one produces, word for word, so you
   score real output rather than your impression of it.

### Test briefs

Load each one fresh from its share link (`ideas.html#kind=...`) so answers from the previous
brief can't leak in:

| # | Brief |
|---|---|
| 1 | App → Money → Budget → Playful → Phone. The owner's own example: "a finance app for dogs". |
| 2 | App → Health and wellness → Journal → Creative → Phone |
| 3 | App → Fashion and brands → Storefront → Creative → Web |
| 4 | Game → In the browser → 3D → Shooter → Fantasy → Everything reacts, 8 blocks |
| 5 | Game → A download → 2D → Puzzle → Cozy, 3 blocks |
| 6 | Interactive art piece → The body → Poke at it → 3D → Eerie |
| 7 | Portfolio piece → Graphics skill → A weekend → 3D |
| 8 | Website → A product launch → Minimal → Scroll storytelling |
| 9 | Tool → Security work → Web app |
| 10 | Surprise me, three times |

## Part 1: Score every idea

Score each of the 30+ ideas on the rubric below, 0 to 10 per criterion, with one sentence of
evidence per score. Be strict: a 5 is mediocre, a 7 is good, and a 9 means you'd forward it to a
friend. Never round up to be kind, and never invent precision you don't have.

| Criterion | Weight | What a 10 looks like | What a 3 looks like |
|---|---|---|---|
| **Clarity** | 20% | A stranger could repeat what it is after reading it once. | You finish the pitch and still can't say what the product *does*. |
| **Differentiation** | 25% | You can name the three closest existing products, and this is clearly not any of them. | It is Rocket Money, YNAB or Minecraft with a filter on top. |
| **Coherence** | 15% | Every block serves one experience; remove one and something is lost. | Block soup: features stacked side by side with no reason to coexist. |
| **Buildability** | 15% | One person could ship a first version in the brief's time budget, using the linked references. | It needs a team, a backend nobody mentioned, or research that doesn't exist yet. |
| **Reference quality** | 10% | Each block's linked repos are the best places in the archive to learn that block. | Links are loosely related, abandoned, or a list of links. |
| **Ownership** | 10% | There is obvious room for the owner's story, rules, art direction or voice. | Nothing left to decide; it is a finished product with no gap for the maker. |
| **Delight** | 5% | There is one moment people would screenshot or film. | Competent and forgettable. |

For **Differentiation**, always write it out in full:
- **Closest existing products:** name three real ones (for a finance app: Rocket Money, YNAB,
  Copilot; for a voxel game: Minecraft, Teardown, Vintage Story).
- **Same as them:** what this idea shares with those products.
- **Different from them:** what this idea does that none of them do.
- **Verdict:** *new*, *meaningful twist* or *reskin*. A reskin caps the whole idea at 5 no matter
  what else it scores.

The overall score is the weighted sum, to one decimal place. Ideas under 6.0 are failures of the
generator, not bad luck. Find the cause of each one.

## Part 2: The summary every idea must have

Right now an idea is a title, a pitch sentence built from block hooks, and a list of blocks.
That's not enough. After the owner answers the questions, every idea must open with a **2 to 3
sentence summary** that a founder could put on a slide. It must say:

1. **What it is, and who it's for.** A specific audience, not "users".
2. **The signature experience.** The one interaction people will remember.
3. **How it looks and feels.** A named art style or mood, not "modern and clean".

Write it the way this example reads:

> **Good Boy Budget.** A playful budgeting app for dog owners that turns your monthly spending
> into your dog's day: overspend on takeout and he skips the park; hit your savings goal and he
> gets a new toy. It's drawn in chunky risograph-print colours, and every purchase drops a
> physics-simulated treat into his bowl.

Then, under the summary:
- **Why it's different:** one sentence naming the closest product and what this does that it
  doesn't. For example: "Rocket Money tells you what you spent; this makes you feel it through
  something you care about."
- **Score:** the overall score from Part 1 as a badge, with the per-criterion breakdown behind
  a disclosure. It is shown so the owner can pick, not to decorate.
- **How it's built:** which block does which job, in one line each. For example: "Rigid-body
  physics (matter-js) drops the treats."
- **First weekend:** the smallest version that is already fun, in three bullets.
- **Make it yours:** the existing prompts, rewritten so they refer to *this* idea, not to the
  project type in general.

The generator is a static site with no backend, so all of this must be produced client-side
from data and templates. Propose exactly how:
- **New questions** that feed the summary. At minimum: **Audience** (who it's for: dog owners,
  students, climbers, new parents, retro gamers…), **Art style** (risograph, claymation,
  brutalist, Swiss minimal, pixel art, watercolour, Y2K chrome, blueprint, collage, low-poly…)
  and optionally a **Twist** in the owner's own words. Every question keeps "Any" as a choice.
- **A comparison dataset,** e.g. `data/comps.json`. For each domain it lists the well-known
  products and their defining traits: Rocket Money (subscription tracking, bank sync, bill
  negotiation), YNAB (envelope budgeting, manual allocation) and so on. Differentiation is
  then computed as trait overlap between the idea and its closest comps. Show the maths.
- **Summary templates** keyed by project type, with slots for audience, signature block, art
  style and twist. They must read as natural English for every combination. Show 10 filled
  examples, including the worst case you can find.
- **A quality gate:** generate more candidates than you show (for example 12), score them, and
  display the best three. Never show one that fails the reskin test.

## Part 3: Review the interface

Critique the section as a product, with a screenshot for every issue you raise:
- **Flow:** is the order of questions right? Which question should come first to make every
  later answer more useful? Is anything asked that doesn't change the output? (If it doesn't
  change the output, cut it.)
- **Wording:** every label, option, button and empty state. Plain words, the user's vocabulary,
  no internal terms like "blocks" if people don't understand them. Propose the exact copy.
- **Defaults and first view:** the page must open on a strong, filled-in example, never an
  empty form.
- **Feedback:** does generating, locking, swapping and copying each give clear, immediate
  feedback? Is there a loading state everywhere something takes time?
- **Hierarchy:** on each idea card, is the most important thing (the summary) the most visible?
  Is the score easy to read without shouting?
- **Comparison:** can the owner compare three ideas side by side and pick one? Would a compare
  view or a "keep this one" action help?
- **Sharing and handoff:** do share links and "Copy as prompt" carry the summary, score and
  comparison, so a Claude session can go straight to a build plan?
- **Mobile:** 375px wide, one hand. Nothing clipped, nothing that needs horizontal scrolling,
  and tap targets at least 40px.
- **Accessibility:** labels, focus order, contrast in both themes, reduced motion, and screen
  reader announcements when ideas change.
- **Consistency:** it must use Codex's existing tokens (4px spacing scale, one 6px radius, one
  border elevation, IBM Plex Sans and Mono). Flag anything that drifts.
- **Vibe-coded tells:** no purple gradients, sparkle emoji, hover lifts, emoji as UI, filler
  taglines, fake precision, dead buttons or placeholder copy. If you find any, remove them.

## Part 4: Review the building blocks

Audit `data/features.json` as the raw material every idea is made from:
- **Coverage:** for each project type and each answer, how many blocks can it draw on? Name the
  thin spots. Money, fashion and tools likely lack domain-specific blocks, like bank-sync
  alternatives, receipts or envelopes for money, and size guides or outfit builders for fashion.
  Propose the missing blocks and the archive repos (or scout searches) that back them.
- **Hooks:** every `hook` must read naturally after "…, where". List every one that doesn't,
  such as "the level itself…" in an app, and rewrite it.
- **Tags:** tags must match the answer values exactly. Find tags no answer produces and answers
  no tag matches.
- **Pairings:** which blocks clash (a live-coded sequencer in a budgeting app), and which pairs
  are unusually strong together? Propose a small `pairsWell` / `clashesWith` field and show
  how the picker uses it.
- **References:** spot-check 20 blocks. Is each pinned repo still the best in the archive for
  that job?

## Part 5: Fix it

After the review, implement the changes in this repo, highest impact first:
1. The summary, "Why it's different", score and first-weekend sections on every idea.
2. The Audience, Art style and Twist questions.
3. `data/comps.json` and the differentiation scoring, with the reskin cap.
4. The quality gate: over-generate, score, show the best three.
5. Interface and copy fixes from Part 3.
6. Block catalogue fixes from Part 4.

Rules while implementing:
- Keep it a static site. No new build tools, frameworks or backend.
- Reuse the existing design tokens and components. No new radii, colours or fonts.
- Never delete archive data. Only add to `data/features.json` and `data/comps.json`.
- Every new block's pinned repos must exist in `data/index.json`. Check this in code.
- Keep share links backward-compatible: old links must still open.

## Part 6: Prove it

Re-run all ten test briefs on the fixed version and deliver:
- **Scorecard:** a before-and-after table of the average score per brief and per criterion.
  The target is an average of at least 7.5, with no shown idea under 6.0 and no reskins.
- **The ten best ideas** it produced, each with its full summary exactly as the page shows it.
- **The worst idea it still produces,** and why. Be honest about what's left.
- **Screenshots** of desktop, phone and dark mode.
- **A changelog** of what changed and why, in plain language.

## How to write

- Talk like a design lead in a critique: direct, specific and kind to the work, never vague.
  "The pitch lists five hooks in one sentence, so nothing stands out" is useful; "could be
  punchier" is not.
- Every criticism comes with the fix.
- Prefer showing over describing: real output, real screenshots and real copy.
- No filler, no hype and no buzzwords. If an idea is a reskin, say so and name what it's a
  reskin of.
