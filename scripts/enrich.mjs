// Step 2 — pull metadata for new candidates and add them to data/index.json.
import { gh, readJSON, writeJSON, today, isLinkCollection } from './lib.mjs';

const sources = await readJSON('sources.json');
const seeds = await readJSON('seeds.json', { repos: [] });
const seedBy = new Map(seeds.repos.map((s) => [s.repo.toLowerCase(), s]));
const candidates = await readJSON('candidates.json', []);
const index = await readJSON('index.json', { updated: null, repos: [] });

// First image or GIF in a README, resolved to an absolute URL.
function firstImage(readme, repo, branch) {
  const md = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/.exec(readme)?.[1];
  const html = /<img[^>]+src=["']([^"']+)["']/i.exec(readme)?.[1];
  const src = [md, html].filter(Boolean).find((s) => !/shields\.io|badge|travis-ci|codecov|badgen/i.test(s));
  if (!src) return null;
  // github.com/o/r/blob|raw/branch/path → raw file; other absolute URLs (incl. user-attachments) as-is.
  const blob = /^https?:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:blob|raw)\/(.+)$/.exec(src);
  if (blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}`;
  if (/^https?:/.test(src)) return src;
  return `https://raw.githubusercontent.com/${repo}/${branch}/${src.replace(/^\.?\//, '')}`;
}

let added = 0;
for (const c of candidates.slice(0, sources.limits.max_new_per_run)) {
  try { if (await enrichOne(c)) added++; } catch (e) { console.warn(`enrich skipped ${c.repo}: ${e.message}`); }
}

async function enrichOne(c) {
  const meta = await gh(`/repos/${c.repo}`);
  if (!meta || meta.archived && meta.stargazers_count < sources.limits.min_stars) return false;
  const seedEntry = seedBy.get(c.repo.toLowerCase());
  if (!seedEntry && isLinkCollection({ repo: meta.full_name, description: meta.description, topics: meta.topics })) return false;
  const readme = (await gh(`/repos/${c.repo}/readme`, { accept: 'application/vnd.github.raw', raw: true })) ?? '';
  const seed = seedBy.get(c.repo.toLowerCase());
  const stub = index.repos.find((r) => r.stub && r.repo.toLowerCase() === c.repo.toLowerCase());
  if (stub) index.repos.splice(index.repos.indexOf(stub), 1);
  index.repos.push({
    repo: meta.full_name,
    url: meta.html_url,
    description: meta.description,
    homepage: meta.homepage || seed?.demo || (meta.has_pages ? `https://${meta.owner.login}.github.io/${meta.name}/` : null),
    language: meta.language,
    topics: meta.topics ?? [],
    stars: meta.stargazers_count,
    pushed: meta.pushed_at?.slice(0, 10),
    licence: meta.license?.spdx_id && meta.license.spdx_id !== 'NOASSERTION' ? meta.license.spdx_id : (seed?.licence_recorded ?? 'unknown'),
    categories: c.categories.length ? c.categories : ['random'],
    idea: seed?.idea ?? null,
    note: seed?.note ?? '',
    technique: seed?.technique ?? null, // scout-prompt seeds bring one; tag.mjs fills the rest
    readme_image: firstImage(readme, meta.full_name, meta.default_branch),
    media: null,     // filled by capture.mjs
    sources: c.sources,
    first_seen: stub?.first_seen ?? today(),
  });
  return true;
}

index.updated = today();
await writeJSON('index.json', index);
await writeJSON('candidates.json', candidates.slice(sources.limits.max_new_per_run));
console.log(`enrich: +${added} (index now ${index.repos.length})`);
