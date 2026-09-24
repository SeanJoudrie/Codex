// Step 4b — score every repo and rank it inside each category (best first).
// Nothing is ever removed: the index is an archive, weak entries just rank last.
import { readJSON, writeJSON, isLinkCollection } from './lib.mjs';
import { usefulness } from '../site/match.js';

const index = await readJSON('index.json');
const seeds = new Map((await readJSON('seeds.json')).repos.map((s) => [s.repo.toLowerCase(), s]));
const sources = await readJSON('sources.json');

// Re-derive categories every run so fixing a source's tags fixes every repo it found.
const bySource = new Map();
for (const l of sources.awesome_lists) bySource.set(`awesome:${l.repo}`, l.categories);
for (const [c, topics] of Object.entries(sources.topics)) for (const t of topics) bySource.set(`topic:${t}`, [c]);
for (const q of sources.queries) bySource.set(`query:${q.q}`, q.categories);
bySource.set('random', ['random']);
function categoriesFor(r) {
  const seed = seeds.get(r.repo.toLowerCase());
  if (seed?.categories?.length) return seed.categories;
  const derived = [...new Set((r.sources ?? []).flatMap((s) => bySource.get(s) ?? []))];
  return derived.length ? derived.slice(0, 3) : r.categories?.length ? r.categories : ['random'];
}
for (const r of index.repos) r.categories = categoriesFor(r);
for (const r of index.repos) {
  r.list = isLinkCollection(r) || undefined; // flag lists found before the flag existed
  r.score = usefulness(r);
}

const byCat = {};
for (const r of index.repos) for (const c of r.categories) (byCat[c] ??= []).push(r);
for (const r of index.repos) r.rank = {};
for (const [c, list] of Object.entries(byCat)) {
  list.sort((a, b) => b.score - a.score || (b.stars ?? 0) - (a.stars ?? 0));
  list.forEach((r, i) => (r.rank[c] = i + 1));
}
index.repos.sort((a, b) => b.score - a.score);
await writeJSON('index.json', index);
console.log(`rank: scored ${index.repos.length} repos across ${Object.keys(byCat).length} categories`);
