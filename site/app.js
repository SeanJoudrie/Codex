// Codex — static client. Reads data/index.json + data/categories.json.
import { matchIdea } from './match.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const BOOKMARK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h8v11l-4-2.8-4 2.8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';

let index, categories;
try {
  [index, categories] = await Promise.all([
    fetch('data/index.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch('data/categories.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
  ]);
} catch {
  $('#grid').innerHTML = '';
  $('#grid').removeAttribute('aria-busy');
  $('#meta').textContent = 'The archive could not be loaded.';
  $('#empty').hidden = false;
  $('#empty').textContent = 'The archive could not be loaded. Check your connection and reload the page.';
  throw new Error('Codex: failed to load data');
}

const repos = index.repos;
const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));
const favs = new Set(store.get('favs', []));
const state = { q: '', cat: store.get('cat', 'all'), favOnly: false, sort: store.get('sort', 'best') };
if (state.cat !== 'new' && !categories.some((c) => c.id === state.cat)) state.cat = 'all';

function isoDaysAgo(n) { return new Date(Date.now() - n * 864e5).toISOString().slice(0, 10); }
const fmtStars = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n ?? 0));
const updated = index.updated ? new Date(`${index.updated}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
$('#meta').textContent = `${repos.length.toLocaleString()} projects${updated ? ` · updated ${updated}` : ''}`;
$('#sort').value = state.sort;

function renderChips() {
  const counts = {};
  repos.forEach((r) => r.categories.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)));
  const items = [{ id: 'all', label: 'All', n: repos.length }, { id: 'new', label: 'New this week', n: repos.filter(isNew).length, cls: 'new' },
    ...categories.map((c) => ({ ...c, n: counts[c.id] ?? 0 }))];
  $('#chips').innerHTML = items.filter((c) => c.id === 'all' || c.n)
    .map((c) => `<button class="chip${c.cls ? ` ${c.cls}` : ''}" type="button" data-cat="${c.id}" aria-pressed="${state.cat === c.id}" title="${esc(c.hint ?? '')}">${esc(c.label)}<span class="n">${c.n}</span></button>`).join('');
}

function thumb(r) {
  if (r.media?.path) return `<img class="shot" src="${esc(r.media.path)}" alt="" loading="lazy" decoding="async">`;
  return `<div class="ph">${esc(r.repo.split('/')[1])}</div>`;
}

function card(r) {
  const [owner, name] = r.repo.split('/');
  const rankHere = state.cat !== 'all' && r.rank?.[state.cat];
  return `<article class="card" data-repo="${esc(r.repo)}" tabindex="0" aria-label="${esc(r.repo)}">
    ${thumb(r)}
    <div class="body">
      <p class="name"><span class="owner">${esc(owner)}/</span>${esc(name)}</p>
      <p class="desc">${esc(r.note || r.technique || r.description || '')}</p>
      <div class="row">
        ${rankHere ? `<span class="tag">#${rankHere}</span>` : ''}
        ${r.stub && !r.stars ? '<span>details pending</span>' : `<span>${fmtStars(r.stars)} ${r.stars === 1 ? 'star' : 'stars'}</span>`}
        ${r.language && r.language !== 'unknown' ? `<span>${esc(r.language)}</span>` : ''}
        ${r.list ? '<span class="tag">link list</span>' : ''}
        <button class="fav" type="button" data-fav="${esc(r.repo)}" aria-pressed="${favs.has(r.repo)}" aria-label="Save ${esc(r.repo)}">${BOOKMARK}</button>
      </div>
    </div>
  </article>`;
}

// Found in the last 7 days by the robot (not the original hand-picked seed list).
function isNew(r) { return r.first_seen >= isoDaysAgo(7) && !r.sources?.every((s) => s === 'seed'); }

function matches(r) {
  if (state.cat === 'new') { if (!isNew(r)) return false; }
  else if (state.cat !== 'all' && !r.categories.includes(state.cat)) return false;
  if (state.favOnly && !favs.has(r.repo)) return false;
  return true;
}

const shotRank = (r) => ({ demo: 3, readme: 2, social: 1 }[r.media?.kind] ?? 0);
const gemScore = (r) => shotRank(r) * 2 - Math.log10((r.stars ?? 0) + 10) + (r.pushed > isoDaysAgo(365) ? 1 : 0);
const sorters = {
  best: (a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.stars ?? 0) - (a.stars ?? 0),
  new: (a, b) => (b.first_seen ?? '').localeCompare(a.first_seen ?? '') || (b.score ?? 0) - (a.score ?? 0),
  stars: (a, b) => (b.stars ?? 0) - (a.stars ?? 0),
  gem: (a, b) => gemScore(b) - gemScore(a),
  visual: (a, b) => shotRank(b) - shotRank(a) || (b.score ?? 0) - (a.score ?? 0),
};

function render() {
  // A typed query is treated as an idea: ranked by relevance, then usefulness.
  const pool = repos.filter(matches);
  const list = state.q ? matchIdea(pool, state.q, catLabel).map((x) => x.r) : pool.sort(sorters[state.sort]);
  $('#ideaNote').hidden = !state.q;
  $('#ideaNote').textContent = state.q ? `${list.length} ${list.length === 1 ? 'reference' : 'references'} for “${state.q}”, closest first` : '';
  $('#grid').innerHTML = list.map(card).join('');
  $('#grid').removeAttribute('aria-busy');
  $('#empty').hidden = list.length > 0;
  $('#empty').textContent = state.q
    ? 'Nothing in the archive matches that idea yet. Try describing the effect or the technique instead.'
    : state.favOnly ? 'Nothing saved yet. Use the bookmark on any card to save it.'
    : state.cat === 'new' ? 'Nothing new in the last 7 days. The robot searches for new projects every Monday.' : 'No projects in this category yet.';
}

// "topic:webgl" → "GitHub topic “webgl”" etc.
function source(s) {
  const [kind, ...rest] = s.split(':'); const v = rest.join(':').replace(/"/g, '');
  return ({ seed: 'Hand-picked', scout: 'Scout search', random: 'Random draw', topic: `Topic “${v}”`, query: `Search “${v}”`,
    awesome: `Listed in ${v}`, by: `Made by ${v}`, 'starred-by': `Starred by ${v}` })[kind] ?? s;
}

function open(repo) {
  const r = repos.find((x) => x.repo === repo);
  if (!r) return;
  const d = $('#detail');
  const ranks = Object.entries(r.rank ?? {}).map(([c, n]) => `#${n} in ${esc(catLabel[c] ?? c)}`).join(' · ');
  d.innerHTML = `${r.media?.path ? `<img src="${esc(r.media.path)}" alt="Screenshot of ${esc(r.repo)}">` : ''}
    <div class="body">
      <h2 id="detailTitle">${esc(r.repo)}</h2>
      ${r.description ? `<p>${esc(r.description)}</p>` : ''}
      <dl>
        ${r.note ? `<dt>Why it's here</dt><dd>${esc(r.note)}</dd>` : ''}
        ${r.technique ? `<dt>Technique</dt><dd>${esc(r.technique)}</dd>` : ''}
        <dt>Ranking</dt><dd>${ranks || '—'}${r.score != null ? ` · usefulness ${r.score}/100` : ''}</dd>
        <dt>Details</dt><dd>${(r.stars ?? 0).toLocaleString()} stars${r.language && r.language !== 'unknown' ? ` · ${esc(r.language)}` : ''}${r.pushed ? ` · last updated ${esc(r.pushed)}` : ''}</dd>
        <dt>Licence</dt><dd>${esc(r.licence ?? 'unknown')}</dd>
        <dt>Found</dt><dd>${esc((r.sources ?? []).slice(0, 4).map(source).join(' · '))}${r.first_seen ? ` · ${esc(r.first_seen)}` : ''}</dd>
      </dl>
      <div class="links">
        <a class="btn" href="${esc(r.url ?? `https://github.com/${r.repo}`)}" target="_blank" rel="noopener">View on GitHub</a>
        ${r.homepage ? `<a class="btn" href="${esc(r.homepage)}" target="_blank" rel="noopener">Open demo</a>` : ''}
        <button class="btn secondary close" type="button">Close</button>
      </div>
    </div>`;
  d.showModal();
}

document.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) {
    const id = fav.dataset.fav;
    favs.has(id) ? favs.delete(id) : favs.add(id);
    store.set('favs', [...favs]);
    document.querySelectorAll(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => b.setAttribute('aria-pressed', favs.has(id)));
    if (state.favOnly) render();
    return;
  }
  const chip = e.target.closest('[data-cat]');
  if (chip) { state.cat = chip.dataset.cat; store.set('cat', state.cat); renderChips(); render(); return; }
  if (e.target.closest('.close') || e.target === $('#detail')) { $('#detail').close(); return; }
  const c = e.target.closest('.card:not(.skeleton)');
  if (c) open(c.dataset.repo);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList?.contains('card')) open(e.target.dataset.repo);
  if (e.key === '/' && document.activeElement !== $('#q') && !$('#detail').open) { e.preventDefault(); $('#q').focus(); }
});
$('#q').addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
$('#favOnly').addEventListener('change', (e) => { state.favOnly = e.target.checked; render(); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; store.set('sort', state.sort); render(); });

renderChips();
render();
