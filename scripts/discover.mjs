// Step 1 — find candidate repos from every source in data/sources.json.
// Writes data/candidates.json: repos not yet in the index, with where they came from.
import { gh, readJSON, writeJSON, repoFromUrl } from './lib.mjs';

const sources = await readJSON('sources.json');

// Runs are daily, but discovery is slow (search rate limits). Rebuild the queue on
// Mondays, when it runs low, or when forced; otherwise let enrich keep working through it.
const queued = await readJSON('candidates.json', []);
const monday = new Date().getUTCDay() === 1;
if (!monday && !process.env.FORCE_DISCOVER && queued.length >= sources.limits.max_new_per_run) {
  console.log(`discover: skipped (${queued.length} still queued; full discovery runs on Mondays)`);
  process.exit(0);
}
const index = await readJSON('index.json', { repos: [] });
// Stub entries (seeded offline, never enriched) don't count as known — they get enriched for real.
// One failing source must never sink the whole run.
async function safely(label, fn) {
  try { await fn(); } catch (e) { console.warn(`skipped ${label}: ${e.message}`); }
}

const known = new Set(index.repos.filter((r) => !r.stub).map((r) => r.repo.toLowerCase()));
const found = new Map(); // repo -> { repo, categories:Set, sources:Set }

function add(repo, categories = [], source) {
  if (!repo || known.has(repo.toLowerCase())) return;
  const key = repo.toLowerCase();
  const entry = found.get(key) ?? { repo, categories: new Set(), sources: new Set() };
  categories.forEach((c) => entry.categories.add(c));
  entry.sources.add(source);
  found.set(key, entry);
}

// Seeds first, so the Master Doc repos always make it in.
const seeds = await readJSON('seeds.json', { repos: [] });
for (const s of seeds.repos) add(s.repo, s.categories, 'seed');

// Awesome-lists: every github.com link in the README.
for (const list of sources.awesome_lists) await safely(list.repo, async () => {
  const readme = await gh(`/repos/${list.repo}/readme`, { accept: 'application/vnd.github.raw', raw: true });
  if (!readme) { console.warn(`awesome list missing: ${list.repo}`); return; }
  const links = readme.match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/g) ?? [];
  for (const href of links) {
    const repo = repoFromUrl(href);
    if (repo && repo.toLowerCase() !== list.repo.toLowerCase()) add(repo, list.categories, `awesome:${list.repo}`);
  }
});

// Search: topics and free-text queries, most-starred first.
async function search(q, categories, label) {
  await safely(label, () => searchPages(q, categories, label));
}
async function searchPages(q, categories, label) {
  for (let page = 1; page <= sources.limits.search_pages_per_query; page++) {
    const res = await gh(`/search/repositories?q=${encodeURIComponent(`${q} stars:>=${sources.limits.min_stars}`)}&sort=stars&per_page=50&page=${page}`);
    for (const item of res?.items ?? []) add(item.full_name, categories, label);
    if (!res || res.items.length < 50) break;
  }
}
for (const [category, topics] of Object.entries(sources.topics)) {
  for (const t of topics) await search(`topic:${t}`, [category], `topic:${t}`);
}
for (const { q, categories } of sources.queries) await search(q, categories, `query:${q}`);

// Random draws: a random month of GitHub history, a random page of well-starred repos.
if (sources.random) {
  const { draws_per_run, window_days, earliest, min_stars } = sources.random;
  const start = Date.parse(earliest), span = Date.now() - start - window_days * 864e5;
  for (let i = 0; i < draws_per_run; i++) {
    const from = new Date(start + Math.random() * span);
    const to = new Date(from.getTime() + window_days * 864e5);
    const q = `created:${from.toISOString().slice(0, 10)}..${to.toISOString().slice(0, 10)} stars:>=${min_stars}`;
    const page = 1 + Math.floor(Math.random() * 3);
    await safely(`random ${q}`, async () => {
      const res = await gh(`/search/repositories?q=${encodeURIComponent(q)}&per_page=10&page=${page}`);
      for (const item of res?.items ?? []) if (!item.fork) add(item.full_name, ['random'], 'random');
    });
  }
}

// People: their own repos and what they star.
for (const user of sources.people.follow) await safely(user, async () => {
  const own = await gh(`/users/${user}/repos?sort=pushed&per_page=30`);
  for (const r of own ?? []) if (!r.fork) add(r.full_name, [], `by:${user}`);
  const starred = await gh(`/users/${user}/starred?per_page=50`);
  for (const r of starred ?? []) add(r.full_name, [], `starred-by:${user}`);
});

// Merge with what's already queued so nothing found is ever dropped.
for (const q of queued) for (const src of q.sources) add(q.repo, q.categories, src);

const candidates = [...found.values()].map((e) => ({
  repo: e.repo, categories: [...e.categories], sources: [...e.sources],
}));
// Repos surfaced by several sources are the strongest signal — process them first.
candidates.sort((a, b) => (b.sources.includes('seed') - a.sources.includes('seed')) || b.sources.length - a.sources.length);
await writeJSON('candidates.json', candidates);
console.log(`discover: ${candidates.length} repos queued`);
