// Step 1b — repos people are talking about: Hacker News, Lobsters and Reddit.
// Runs every day (trends go stale fast). Records each mention in data/buzz.json
// and queues repos the archive doesn't have yet. Any site that refuses is skipped.
import { readJSON, writeJSON, repoFromUrl, today } from './lib.mjs';

const sources = await readJSON('sources.json');
const cfg = sources.social;
if (!cfg) process.exit(0);
const since = Date.now() - cfg.window_days * 864e5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (compatible; codex-archive/1.0; +https://seanjoudrie.github.io/Codex/)';

async function get(url, type = 'json') {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${res.status}`);
  const text = await res.text();
  if (type === 'json') return JSON.parse(text);
  return text;
}

const buzz = await readJSON('buzz.json', { updated: null, repos: {} });
const mentions = []; // { repo, categories, source, where, url, title, points, date }

// Every distinct github.com/owner/repo in a blob of text or HTML.
function reposIn(...texts) {
  const out = new Set();
  for (const t of texts) for (const href of (t ?? '').match(/github\.com\/[\w.-]+\/[\w.-]+/g) ?? []) {
    const r = repoFromUrl(href);
    if (r && !r.startsWith('user-attachments/')) out.add(r);
  }
  return [...out];
}

// ---- Hacker News (Algolia API): Show HN posts and stories that link a repo. ----
async function hackerNews() {
  const t = Math.floor(since / 1000);
  for (const tag of ['show_hn', 'story']) {
    const min = tag === 'show_hn' ? cfg.min_points.hn : cfg.min_points.hn * 3;
    for (let page = 0; page < cfg.hn.pages; page++) {
      const q = `https://hn.algolia.com/api/v1/search?tags=${tag}&query=github.com&restrictSearchableAttributes=url` +
        `&numericFilters=created_at_i>${t},points>=${min}&hitsPerPage=100&page=${page}`;
      const res = await get(q);
      for (const h of res.hits) for (const repo of reposIn(h.url, h.story_text)) {
        if (tag === 'story' && h._tags?.includes('show_hn')) continue; // already counted as Show HN
        mentions.push({ repo, categories: [], source: 'hn', where: tag === 'show_hn' ? 'Show HN' : 'Hacker News',
          url: `https://news.ycombinator.com/item?id=${h.objectID}`, title: h.title, points: h.points, date: h.created_at.slice(0, 10) });
      }
      if (page + 1 >= res.nbPages) break;
    }
  }
}

// ---- Lobsters: a small, technical crowd. Hottest plus a few tags. ----
async function lobsters() {
  const feeds = [['hottest', []], ...Object.entries(cfg.lobsters.tags).map(([t, c]) => [`t/${t}`, c])];
  for (const [feed, categories] of feeds) {
    let items;
    try { items = await get(`https://lobste.rs/${feed}.json`); } catch (e) { console.warn(`social: lobsters ${feed} skipped (${e.message})`); continue; }
    for (const s of items) {
      if (Date.parse(s.created_at) < since) continue;
      for (const repo of reposIn(s.url, s.description)) {
        mentions.push({ repo, categories, source: 'lobsters', where: 'Lobsters', url: s.short_id_url, title: s.title, points: s.score, date: s.created_at.slice(0, 10) });
      }
    }
    await sleep(500);
  }
}

// ---- Reddit: recent posts per subreddit. Reddit itself blocks most cloud machines, so this
// reads Arctic Shift (a public Reddit archive with vote counts) and only falls back to
// Reddit's own JSON and RSS if the archive is down. After a few refusals it stops for the day.
async function reddit() {
  const { period, delay_ms, pages, subs } = cfg.reddit;
  const after = new Date(since).toISOString().slice(0, 10);
  let refusals = 0;
  const push = (sub, categories, p) => {
    for (const repo of reposIn(p.url, p.selftext)) mentions.push({ repo, categories, source: 'reddit', where: `r/${sub}`,
      url: `https://www.reddit.com/r/${sub}/comments/${p.id}/`, title: p.title, points: p.score ?? null, date: new Date(p.created_utc * 1000).toISOString().slice(0, 10) });
  };
  async function archive(sub, categories) {
    let before = '';
    for (let page = 0; page < pages; page++) {
      const url = `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${sub}&after=${after}${before}` +
        '&limit=100&sort=desc&fields=id,title,url,score,created_utc,selftext';
      // The archive answers 422 "slow down" on busy subreddits; one patient retry usually works.
      const res = await get(url).catch(async () => { await sleep(8_000); return get(url); });
      if (!res.data) throw new Error(res.error ?? 'no data');
      res.data.forEach((p) => push(sub, categories, p));
      if (res.data.length < 100) break;
      before = `&before=${res.data.at(-1).created_utc}`;
      await sleep(delay_ms);
    }
  }
  async function direct(sub, categories) {
    try {
      const res = await get(`https://www.reddit.com/r/${sub}/top.json?t=${period}&limit=100&raw_json=1`);
      res.data.children.forEach(({ data: p }) => push(sub, categories, p));
    } catch {
      const xml = await get(`https://www.reddit.com/r/${sub}/top/.rss?t=${period}&limit=100`, 'text');
      // The feed has no vote counts; "top of the week in its subreddit" is the signal.
      for (const e of xml.split('<entry>').slice(1)) {
        const id = /<id>t3_(\w+)<\/id>/.exec(e)?.[1];
        const title = /<title>([^<]*)<\/title>/.exec(e)?.[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        const published = /<published>([^<]+)<\/published>/.exec(e)?.[1];
        if (id && published) push(sub, categories, { id, title, url: e, score: null, created_utc: Date.parse(published) / 1000 });
      }
    }
  }
  for (const [sub, categories] of Object.entries(subs)) {
    if (refusals >= 3) { console.warn('social: reddit refused 3 times in a row, skipping the rest today'); return; }
    try { await archive(sub, categories); refusals = 0; }
    catch (e1) {
      try { await direct(sub, categories); refusals = 0; }
      catch (e2) { refusals++; console.warn(`social: r/${sub} skipped (archive ${e1.message}, reddit ${e2.message})`); }
    }
    await sleep(delay_ms);
  }
}

// Drop the whispers: posts nobody upvoted aren't a signal. (RSS posts have no count and stay.)
const floor = (m) => m.points == null || m.points >= (cfg.min_points[m.source] ?? 0);

const results = {};
for (const [name, fn] of [['hn', hackerNews], ['lobsters', lobsters], ['reddit', reddit]]) {
  const before = mentions.length;
  try { await fn(); } catch (e) { console.warn(`social: ${name} skipped (${e.message})`); }
  results[name] = mentions.length - before;
}

// Record every mention (never deleted; old ones simply stop counting as "talked about").
const queued = await readJSON('candidates.json', []);
const index = await readJSON('index.json', { repos: [] });
const known = new Set([...index.repos.filter((r) => !r.stub).map((r) => r.repo.toLowerCase()), ...queued.map((q) => q.repo.toLowerCase())]);
const fresh = new Map();
for (const m of mentions.filter(floor)) {
  const key = Object.keys(buzz.repos).find((k) => k.toLowerCase() === m.repo.toLowerCase()) ?? m.repo;
  const list = (buzz.repos[key] ??= []);
  const { repo, categories, ...entry } = m;
  const same = list.find((x) => x.url === entry.url);
  if (same) Object.assign(same, entry); else list.push(entry);
  list.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const lower = m.repo.toLowerCase();
  if (known.has(lower)) {
    const q = queued.find((x) => x.repo.toLowerCase() === lower);
    if (q) { q.categories = [...new Set([...q.categories, ...categories])]; if (!q.sources.includes(`social:${m.where}`)) q.sources.push(`social:${m.where}`); }
    continue;
  }
  const f = fresh.get(lower) ?? { repo: m.repo, categories: [], sources: [] };
  f.categories = [...new Set([...f.categories, ...categories])];
  if (!f.sources.includes(`social:${m.where}`)) f.sources.push(`social:${m.where}`);
  fresh.set(lower, f);
}
buzz.updated = today();
await writeJSON('buzz.json', buzz);

// Talked-about repos go straight after the hand-picked seeds, so they're enriched while they're current.
const seedsFirst = queued.filter((q) => q.sources.includes('seed'));
const rest = queued.filter((q) => !q.sources.includes('seed'));
await writeJSON('candidates.json', [...seedsFirst, ...fresh.values(), ...rest]);
console.log(`social: ${mentions.filter(floor).length} mentions (hn ${results.hn}, lobsters ${results.lobsters}, reddit ${results.reddit}); ${fresh.size} new repos queued`);
