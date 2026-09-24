// Codex — static client. Reads data/index.json + data/categories.json.
import { matchIdea } from './match.js';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const [index, categories] = await Promise.all([
  fetch('data/index.json').then((r) => r.json()).catch(() => ({ repos: [] })),
  fetch('data/categories.json').then((r) => r.json()),
]);
const repos = index.repos;
const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));
const favs = new Set(store.get('favs', []));
const state = { q: '', cat: store.get('cat', 'all'), favOnly: false, sort: store.get('sort', 'best') };

// Stable colour per repo for placeholder cards.
const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

$('#meta').textContent = `${repos.length} repos · updated ${index.updated ?? '—'}`;
$('#sort').value = state.sort;

function renderChips() {
  const counts = {};
  repos.forEach((r) => r.categories.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)));
  const items = [{ id: 'all', label: 'All', n: repos.length }, ...categories.map((c) => ({ ...c, n: counts[c.id] ?? 0 }))];
  $('#chips').innerHTML = items.filter((c) => c.id === 'all' || c.n)
    .map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}" title="${esc(c.hint ?? '')}">${esc(c.label)}<span class="n">${c.n}</span></button>`).join('');
}

function thumb(r) {
  if (r.media?.path) return `<img class="shot" src="${esc(r.media.path)}" alt="" loading="lazy">`;
  const h = hue(r.repo);
  return `<div class="ph" style="background:hsl(${h} 40% 34%)">${esc(r.repo.split('/')[1])}</div>`;
}

function card(r) {
  const [owner, name] = r.repo.split('/');
  return `<article class="card" data-repo="${esc(r.repo)}" tabindex="0">
    ${thumb(r)}
    <div class="body">
      <p class="name"><span class="owner">${esc(owner)}/</span>${esc(name)}</p>
      <p class="desc">${esc(r.note || r.technique || r.description || '')}</p>
      <div class="row">
        ${r.stub && !r.stars ? '<span>not fetched yet</span>' : `<span>★ ${(r.stars ?? 0).toLocaleString()}</span>`}
        ${r.language && r.language !== 'unknown' ? `<span>${esc(r.language)}</span>` : ''}
        ${r.list ? '<span class="kind">list</span>' : ''}
        ${r.rank && state.cat !== 'all' && r.rank[state.cat] ? `<span class="kind">#${r.rank[state.cat]}</span>` : ''}
        <button class="fav" data-fav="${esc(r.repo)}" aria-pressed="${favs.has(r.repo)}" aria-label="Favourite">★</button>
      </div>
    </div>
  </article>`;
}

function matches(r) {
  if (state.cat !== 'all' && !r.categories.includes(state.cat)) return false;
  if (state.favOnly && !favs.has(r.repo)) return false;
  return true;
}

const sorters = {
  best: (a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.stars ?? 0) - (a.stars ?? 0),
  new: (a, b) => (b.first_seen ?? '').localeCompare(a.first_seen ?? '') || b.stars - a.stars,
  stars: (a, b) => b.stars - a.stars,
  // Hidden gems: has a real screenshot, low stars, recently pushed.
  gem: (a, b) => gemScore(b) - gemScore(a),
  visual: (a, b) => rank(b) - rank(a) || b.stars - a.stars,
};
const rank = (r) => ({ demo: 3, readme: 2, social: 1 }[r.media?.kind] ?? 0);
const gemScore = (r) => rank(r) * 2 - Math.log10((r.stars ?? 0) + 10) + (r.pushed > isoDaysAgo(365) ? 1 : 0);
function isoDaysAgo(n) { return new Date(Date.now() - n * 864e5).toISOString().slice(0, 10); }

function render() {
  // A typed query is treated as an idea: ranked by relevance, then usefulness.
  const pool = repos.filter(matches);
  const list = state.q ? matchIdea(pool, state.q, catLabel).map((x) => x.r) : pool.sort(sorters[state.sort]);
  $('#ideaNote').hidden = !state.q;
  $('#ideaNote').textContent = state.q ? `${list.length} references for “${state.q}”, best matches first` : '';
  $('#grid').innerHTML = list.map(card).join('');
  $('#empty').hidden = list.length > 0;
  $('#empty').textContent = state.q ? 'Nothing in the archive matches that idea yet — try other words, or run the scout prompt on it.' : 'Nothing matches.';
  const fresh = repos.filter((r) => r.first_seen >= isoDaysAgo(7) && !r.sources?.every((s) => s === 'seed'));
  $('#fresh').hidden = !fresh.length || state.q || state.cat !== 'all';
  $('#freshStrip').innerHTML = fresh.slice(0, 24).map(card).join('');
}

function open(repo) {
  const r = repos.find((x) => x.repo === repo);
  if (!r) return;
  const d = $('#detail');
  d.innerHTML = `${r.media?.path ? `<img src="${esc(r.media.path)}" alt="">` : ''}
    <div class="body">
      <h2>${esc(r.repo)}</h2>
      <p>${esc(r.description ?? '')}</p>
      <dl>
        ${r.technique ? `<dt>Technique</dt><dd>${esc(r.technique)}</dd>` : ''}
        ${r.idea ? `<dt>Idea</dt><dd>${esc(r.idea)}</dd>` : ''}
        ${r.note ? `<dt>Note</dt><dd>${esc(r.note)}</dd>` : ''}
        <dt>Category</dt><dd>${r.categories.map((c) => esc(catLabel[c] ?? c)).join(', ')}</dd>
        <dt>Stars</dt><dd>${(r.stars ?? 0).toLocaleString()} · ${esc(r.language ?? '—')} · pushed ${esc(r.pushed ?? '—')}</dd>
        <dt>Rank</dt><dd>${Object.entries(r.rank ?? {}).map(([c, n]) => `#${n} in ${esc(catLabel[c] ?? c)}`).join(' · ') || '—'} · score ${r.score ?? '—'}/100</dd>
        <dt>Licence</dt><dd>${esc(r.licence ?? 'unknown')}</dd>
        <dt>Found via</dt><dd>${esc((r.sources ?? []).join(', '))} · ${esc(r.first_seen ?? '')}</dd>
      </dl>
      <div class="links">
        <a href="${esc(r.url ?? `https://github.com/${r.repo}`)}" target="_blank" rel="noopener">Repo ↗</a>
        ${r.homepage ? `<a href="${esc(r.homepage)}" target="_blank" rel="noopener">Demo ↗</a>` : ''}
        <button class="close" type="button">Close</button>
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
    return;
  }
  const chip = e.target.closest('[data-cat]');
  if (chip) { state.cat = chip.dataset.cat; store.set('cat', state.cat); renderChips(); render(); return; }
  if (e.target.closest('.close') || e.target === $('#detail')) { $('#detail').close(); return; }
  const c = e.target.closest('.card');
  if (c) open(c.dataset.repo);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList?.contains('card')) open(e.target.dataset.repo);
  if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); }
});
$('#q').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
$('#favOnly').addEventListener('change', (e) => { state.favOnly = e.target.checked; render(); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; store.set('sort', state.sort); render(); });

if (!categories.some((c) => c.id === state.cat)) state.cat = 'all';
renderChips();
render();
