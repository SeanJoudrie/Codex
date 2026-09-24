// Codex idea generator: pick what you're making, get ideas that combine 2–10 archive building blocks.
import { matchIdea } from './match.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- questions: each type asks its own follow-ups ----------
const STYLE = ['style', 'Style', [['professional', 'Professional'], ['creative', 'Creative'], ['minimal', 'Minimal'], ['playful', 'Playful']]];
const DIM = ['dim', '2D or 3D', [['2d', '2D'], ['3d', '3D']]];
const KINDS = {
  game: { noun: 'game', steps: [
    ['platform', 'Where it runs', [['browser', 'In the browser'], ['download', 'A download'], ['mobile', 'On phones']]],
    DIM,
    ['genre', 'Genre', [['shooter', 'Shooter'], ['sandbox', 'Survival or sandbox'], ['puzzle', 'Puzzle'], ['racing', 'Racing'], ['strategy', 'Strategy'], ['rpg', 'RPG'], ['idle', 'Idle or incremental'], ['rhythm', 'Rhythm']]],
    ['tone', 'World', [['realistic', 'Realistic'], ['fantasy', 'Fantasy'], ['scifi', 'Sci-fi'], ['horror', 'Horror'], ['cozy', 'Cozy'], ['retro', 'Retro']]],
    ['feel', 'How reactive', [['calm', 'Calm'], ['responsive', 'Responsive'], ['chaotic', 'Everything reacts']]],
  ] },
  render: { noun: 'art piece', steps: [
    ['subject', 'About', [['nature', 'Nature'], ['space', 'Space'], ['body', 'The body'], ['ocean', 'Water'], ['architecture', 'Architecture'], ['abstract', 'Abstract'], ['data', 'Real data']]],
    ['interact', 'People will', [['calm', 'Watch it'], ['responsive', 'Poke at it'], ['music', 'Play it with sound']]],
    DIM,
    ['mood', 'Mood', [['calm', 'Calm'], ['eerie', 'Eerie'], ['playful', 'Joyful'], ['intense', 'Intense']]],
  ] },
  app: { noun: 'app', steps: [
    ['area', 'For', [['wellness', 'Health and wellness'], ['productivity', 'Productivity'], ['finance', 'Money'], ['social', 'Friends and groups'], ['learning', 'Learning'], ['creative', 'Creativity'], ['fashion', 'Fashion and brands'], ['music', 'Music']]],
    ['appkind', 'What kind', null, 'area', {
      wellness: [['journal', 'Journal'], ['habits', 'Habit tracker'], ['sleep', 'Sleep'], ['screentime', 'Screen time'], ['fitness', 'Fitness'], ['meditation', 'Meditation']],
      productivity: [['notes', 'Notes'], ['tasks', 'Tasks'], ['focus', 'Focus timer'], ['planner', 'Planner']],
      finance: [['budget', 'Budget'], ['subscriptions', 'Subscriptions'], ['investing', 'Investing tracker']],
      social: [['events', 'Events'], ['groupchat', 'Group chat'], ['planner', 'Trip planner']],
      learning: [['flashcards', 'Flashcards'], ['language', 'Language'], ['explainer', 'Explainers']],
      creative: [['drawing', 'Drawing'], ['moodboard', 'Moodboard'], ['writing', 'Writing']],
      fashion: [['storefront', 'Storefront'], ['lookbook', 'Lookbook'], ['tryon', 'Virtual try-on']],
      music: [['player', 'Player'], ['visualizer', 'Visualizer'], ['sequencer', 'Beat maker']],
    }],
    STYLE,
    ['platform', 'Platform', [['web', 'Web'], ['mobile', 'Phone'], ['desktop', 'Desktop']]],
  ] },
  portfolio: { noun: 'portfolio piece', steps: [
    ['prove', 'It should prove', [['graphics', 'Graphics skill'], ['systems', 'Engineering depth'], ['design', 'Design taste'], ['ai', 'AI know-how']]],
    ['time', 'Time you have', [['weekend', 'A weekend'], ['week', 'A week'], ['month', 'A month or more']]],
    DIM, STYLE,
  ] },
  website: { noun: 'website', steps: [
    ['for', 'For', [['brand', 'A brand or store'], ['personal', 'Me'], ['launch', 'A product launch'], ['event', 'An event']]],
    STYLE,
    ['signature', 'Signature moment', [['scroll', 'Scroll storytelling'], ['cursor', 'Cursor play'], ['3d', '3D'], ['music', 'Sound']]],
  ] },
  tool: { noun: 'tool', steps: [
    ['for', 'For', [['developers', 'Developers'], ['designers', 'Designers'], ['musicians', 'Musicians'], ['researchers', 'Researchers'], ['security', 'Security work']]],
    ['form', 'Form', [['cli', 'Command line'], ['web', 'Web app'], ['desktop', 'Desktop app']]],
    STYLE,
  ] },
};

// ---------- the "make it yours" part ----------
const YOURS = {
  game: ['Write the world’s history in five sentences before you write any code.', 'Invent one rule no other game has, and build around it.', 'Pick four colours and never use a fifth.', 'Decide what the player loses when they fail, and make it hurt a little.', 'Name the main character and give them one reason to be there.', 'Replace every placeholder sound with one you recorded yourself.'],
  render: ['Tie it to one real place or memory, and say which in the title.', 'Choose a single interaction that surprises people, and hide it.', 'Write a two-line artist statement before building.', 'Limit yourself to one colour plus black and white.'],
  app: ['Name the one feeling it should leave someone with.', 'Write the first-run copy yourself, in your own voice.', 'Choose the one screen people open every day and make it perfect.', 'Cut every feature that isn’t needed on day one.'],
  portfolio: ['Write the case-study sentence first: “I built this to prove …”.', 'Record a 20-second clip of the best moment for your site.', 'Write up the hardest bug you hit and how you fixed it.'],
  website: ['Write the one-sentence value proposition before any design.', 'Photograph or draw your own imagery instead of stock.', 'Decide the one action a visitor should take.'],
  tool: ['Name the person who uses it and describe their worst day.', 'Make the default settings the ones you actually use.', 'Write the README before the code.'],
};

const ADJ = {
  realistic: ['Iron', 'Weathered', 'Grey', 'Plain'], fantasy: ['Gilded', 'Wild', 'Ancient', 'Emberlit'], scifi: ['Orbital', 'Null', 'Signal', 'Vanta'],
  horror: ['Hollow', 'Sunless', 'Silent', 'Rotting'], cozy: ['Little', 'Warm', 'Mossy', 'Sunday'], retro: ['Pixel', 'Arcade', 'Cathode', 'Mono'],
  calm: ['Quiet', 'Slow', 'Still', 'Soft'], eerie: ['Pale', 'Drowned', 'Hollow', 'Sunless'], playful: ['Bright', 'Pocket', 'Bouncy', 'Candy'],
  intense: ['Molten', 'Feral', 'Electric', 'Burning'], professional: ['Clear', 'True', 'North', 'Steady'], creative: ['Painted', 'Loose', 'Open', 'Wild'],
  minimal: ['Bare', 'Plain', 'Single', 'Line'], any: ['Second', 'Open', 'Common', 'Night', 'Field'],
};

const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const SHUFFLE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h3l6 8h3M2 12h3l2-2.7M9 6.7 11 4h3M12 2l2 2-2 2M12 10l2 2-2 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------- seeded randomness so ideas can be shared by link ----------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function weighted(r, items, weight) {
  const total = items.reduce((s, x) => s + weight(x), 0);
  let t = r() * total;
  for (const x of items) { t -= weight(x); if (t <= 0) return x; }
  return items[items.length - 1];
}

// ---------- data ----------
let index, features, byRepo;
try {
  const [i, f] = await Promise.all([
    fetch('data/index.json').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch('data/features.json').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
  ]);
  index = i.repos; features = f.features;
  byRepo = new Map(index.map((r) => [r.repo, r]));
} catch {
  $('#ideas').innerHTML = '<p class="empty">The archive could not be loaded. Check your connection and reload the page.</p>';
  $('#status').textContent = 'The archive could not be loaded.';
  throw new Error('Codex: failed to load data');
}

// ---------- form ----------
const state = { kind: 'game', answers: { platform: 'browser', dim: '3d', tone: 'fantasy' }, count: 5, seed: 1 };

function renderSteps() {
  const k = KINDS[state.kind];
  $('#steps').innerHTML = k.steps.map(([id, label, options, dependsOn, optionsBy]) => {
    const opts = dependsOn ? (optionsBy[state.answers[dependsOn]] ?? []) : options;
    if (dependsOn && !opts.length) return '';
    const cur = state.answers[id] ?? '';
    return `<div class="field"><label for="q-${id}">${esc(label)}</label><select id="q-${id}" data-q="${id}">
      <option value="">Any</option>${opts.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
  }).join('');
}

function validAnswers() {
  const ids = new Set(KINDS[state.kind].steps.map(([id]) => id));
  return Object.fromEntries(Object.entries(state.answers).filter(([k, v]) => v && ids.has(k)));
}
function tagsOf() { return new Set(Object.values(validAnswers())); }
const labelOf = (id) => {
  for (const [qid, , options, dependsOn, optionsBy] of KINDS[state.kind].steps) {
    if (qid !== id) continue;
    const opts = dependsOn ? optionsBy[state.answers[dependsOn]] ?? [] : options;
    return opts.find(([v]) => v === state.answers[id])?.[1];
  }
  return state.answers[id];
};

// ---------- choosing building blocks ----------
function candidates() {
  const tags = tagsOf(), dim = validAnswers().dim;
  return features.filter((f) => f.kinds.includes(state.kind) && !(dim && f.dims && !f.dims.includes(dim)))
    .map((f) => {
      const hits = f.tags.filter((t) => tags.has(t)).length;
      // Blocks that match your answers dominate; the rest stay possible, as rare wildcards.
      return { f, score: tags.size ? (hits ? (1 + 3 * hits) ** 2 : 0.6) : 1 };
    });
}

function needsFoundation() {
  return state.kind === 'game' || ((state.kind === 'render' || state.kind === 'portfolio') && validAnswers().dim === '3d');
}

// Pick n features, keeping any locked ones, spreading across roles so ideas don't repeat one trick.
function chooseFeatures(r, n, keep = []) {
  const pool = candidates();
  const chosen = [...keep];
  const has = (f) => chosen.some((c) => c.id === f.id);
  if (needsFoundation() && !chosen.some((c) => c.role === 'foundation')) {
    const found = pool.filter((x) => x.f.role === 'foundation');
    if (found.length && chosen.length < n) chosen.unshift(weighted(r, found, (x) => x.score).f);
  }
  while (chosen.length < n) {
    const roles = new Set(chosen.map((c) => c.role));
    const rest = pool.filter((x) => !has(x.f) && x.f.role !== 'foundation');
    if (!rest.length) break;
    const fresh = rest.some((x) => !roles.has(x.f.role));
    chosen.push(weighted(r, rest, (x) => x.score * (fresh && roles.has(x.f.role) ? 0.25 : 1)).f);
  }
  return chosen;
}

// Pinned repos first, then the archive's best current match for the feature (so new finds show up).
function refsFor(f) {
  const out = f.repos.map((id) => byRepo.get(id)).filter(Boolean).slice(0, 2);
  const extra = matchIdea(index, f.query).map((x) => x.r).find((r) => !out.includes(r) && !f.repos.includes(r.repo));
  if (extra) out.push(extra);
  return out;
}

// ---------- ideas ----------
function makeIdea(seed) {
  const r = rng(seed);
  const va = validAnswers();
  const tone = va.tone || va.mood || va.style || 'any';
  const idea = { seed, adj: pick(r, ADJ[tone] ?? ADJ.any), features: chooseFeatures(r, state.count), locked: new Set(),
    yours: [], r };
  const pool = [...YOURS[state.kind]];
  for (let i = 0; i < 2 && pool.length; i++) idea.yours.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return idea;
}

const listJoin = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')}${xs.length > 2 ? ',' : ''} and ${xs.at(-1)}`;

function titleOf(idea) {
  const f = idea.features.find((x) => x.role !== 'foundation') ?? idea.features[0];
  return `${idea.adj} ${f?.noun ?? 'Project'}`;
}

function pitchOf(idea) {
  const a = validAnswers(), L = (id) => String(labelOf(id) ?? '');
  // The pitch names the three strongest blocks; the full list sits underneath.
  const hooks = listJoin(idea.features.filter((f) => f.role !== 'foundation' || idea.features.length === 1).slice(0, 3).map((f) => f.hook));
  const where = hooks ? `, where ${hooks}` : '';
  switch (state.kind) {
    case 'game': {
      const dim = a.dim ? `${a.dim.toUpperCase()} ` : '';
      const genre = a.genre ? L('genre').toLowerCase() : 'game';
      const plat = { browser: ' that runs in the browser', download: ' you download', mobile: ' for phones' }[a.platform] ?? '';
      const world = a.tone ? ` set in a ${L('tone').toLowerCase()} world` : '';
      return `A ${dim}${genre}${genre.endsWith('game') ? '' : ' game'}${plat}${world}${where}.`;
    }
    case 'render': return `An interactive ${a.dim ? `${a.dim.toUpperCase()} ` : ''}piece${a.subject ? ` about ${L('subject').toLowerCase()}` : ''}${where}.`;
    case 'app': {
      const style = a.style ? `${L('style').toLowerCase()} ` : '';
      const what = a.appkind ? L('appkind').toLowerCase() : 'app';
      return `A ${style}${what}${what.endsWith('app') ? '' : ' app'}${a.area ? ` for ${L('area').toLowerCase()}` : ''}${a.platform ? ` on ${L('platform').toLowerCase()}` : ''}${where}.`;
    }
    case 'portfolio': return `A ${a.time ? `${L('time').toLowerCase().replace(/^a /, '')} ` : ''}portfolio piece${a.prove ? ` that proves ${L('prove').toLowerCase()}` : ''}${where}.`;
    case 'website': return `A ${a.style ? `${L('style').toLowerCase()} ` : ''}website${a.for ? ` for ${L('for').toLowerCase()}` : ''}${where}.`;
    case 'tool': return `A ${a.form ? `${L('form').toLowerCase()} ` : ''}tool${a.for ? ` for ${L('for').toLowerCase()}` : ''}${where}.`;
  }
}

function refHtml(r) {
  const img = r.media?.path ? `<img src="${esc(r.media.path)}" alt="" loading="lazy">` : '<span class="noimg"></span>';
  return `<a class="ref" href="https://github.com/${esc(r.repo)}" target="_blank" rel="noopener" title="${esc(r.note || r.description || r.repo)}">${img}<span>${esc(r.repo)}</span></a>`;
}

function ideaHtml(idea, n) {
  const chips = Object.keys(validAnswers()).map((k) => `<span>${esc(labelOf(k))}</span>`).join('');
  return `<article class="idea" data-i="${n}">
    <div class="idea-head">
      <h3>${esc(titleOf(idea))}</h3>
      <p class="pitch">${esc(pitchOf(idea))}</p>
      ${chips ? `<div class="chips-row">${chips}</div>` : ''}
    </div>
    <ul class="features">${idea.features.map((f, j) => `
      <li class="feature">
        <button class="icon-btn" type="button" data-lock="${j}" aria-pressed="${idea.locked.has(f.id)}" aria-label="Keep ${esc(f.name)}" title="Keep this when re-rolling">${LOCK}</button>
        <div>
          <p class="fname">${esc(f.name)}</p>
          <p class="fadds">${esc(f.adds)}</p>
          <div class="refs">${refsFor(f).map(refHtml).join('')}</div>
        </div>
        <button class="icon-btn" type="button" data-swap="${j}" aria-label="Swap ${esc(f.name)} for something else" title="Swap for something else">${SHUFFLE}</button>
      </li>`).join('')}
    </ul>
    <div class="yours"><h4>Make it yours</h4><ul>${idea.yours.map((y) => `<li>${esc(y)}</li>`).join('')}</ul></div>
    <div class="actions">
      <button class="btn small" type="button" data-copy>Copy as prompt</button>
      <button class="btn small ghost" type="button" data-reroll>Re-roll unlocked</button>
    </div>
  </article>`;
}

let ideas = [];
function render() {
  $('#ideas').innerHTML = ideas.length ? ideas.map(ideaHtml).join('') : '<p class="empty">No building blocks match every answer. Set one or two questions back to Any.</p>';
  $('#ideas').removeAttribute('aria-busy');
}

function generate(seed = Math.floor(Math.random() * 1e9)) {
  state.seed = seed;
  ideas = [0, 1, 2].map((i) => makeIdea(seed + i * 7919)).filter((x) => x.features.length);
  render();
  writeHash();
  $('#status').textContent = `${features.length} building blocks · ${index.length.toLocaleString()} projects in the archive. Lock blocks you like, swap the rest.`;
}

function promptOf(idea) {
  const lines = [
    `Help me build this idea, using the references from my Codex archive (https://seanjoudrie.github.io/Codex/).`,
    '', `${titleOf(idea)}: ${pitchOf(idea)}`, '', 'Building blocks:',
    ...idea.features.map((f) => `- ${f.name}: ${f.adds}. References: ${refsFor(f).map((r) => `https://github.com/${r.repo}`).join(', ')}`),
    '', 'What makes it mine:', ...idea.yours.map((y) => `- ${y}`),
    '', 'Read the reference READMEs first. Then tell me: the stack to use, how these pieces connect into one thing, the hardest part and which reference solves it, what to build in the first weekend, and the licence of any code I would copy.',
  ];
  return lines.join('\n');
}

// ---------- share links: #kind=game&genre=rpg&n=4&seed=123 ----------
function writeHash() {
  const p = new URLSearchParams({ kind: state.kind, ...validAnswers(), n: state.count, seed: state.seed });
  history.replaceState(null, '', `#${p}`);
}
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (!p.has('kind') || !KINDS[p.get('kind')]) return false;
  state.kind = p.get('kind');
  state.answers = {};
  for (const [id] of KINDS[state.kind].steps) if (p.get(id)) state.answers[id] = p.get(id);
  state.count = Math.min(10, Math.max(2, +p.get('n') || 4));
  state.seed = +p.get('seed') || 1;
  return true;
}

// ---------- events ----------
function syncForm() {
  $('#kind').value = state.kind; $('#count').value = state.count; $('#countOut').textContent = state.count;
  renderSteps();
}
$('#kind').addEventListener('change', (e) => { state.kind = e.target.value; state.answers = {}; renderSteps(); });
$('#steps').addEventListener('change', (e) => {
  const q = e.target.dataset.q; if (!q) return;
  state.answers[q] = e.target.value;
  if (q === 'area') { delete state.answers.appkind; renderSteps(); }
});
$('#count').addEventListener('input', (e) => { state.count = +e.target.value; $('#countOut').textContent = state.count; });
$('#form').addEventListener('submit', (e) => { e.preventDefault(); generate(); });

$('#surprise').addEventListener('click', () => {
  const r = rng(Math.floor(Math.random() * 1e9));
  state.kind = pick(r, Object.keys(KINDS)); state.answers = {};
  for (const [id, , options, dependsOn, optionsBy] of KINDS[state.kind].steps) {
    const opts = dependsOn ? optionsBy[state.answers[dependsOn]] : options;
    if (opts?.length && r() < 0.8) state.answers[id] = pick(r, opts)[0];
  }
  state.count = 2 + Math.floor(r() * 7);
  syncForm(); generate();
});

$('#ideas').addEventListener('click', async (e) => {
  const card = e.target.closest('.idea'); if (!card) return;
  const idea = ideas[+card.dataset.i];
  const lock = e.target.closest('[data-lock]'), swap = e.target.closest('[data-swap]');
  if (lock) {
    const f = idea.features[+lock.dataset.lock];
    idea.locked.has(f.id) ? idea.locked.delete(f.id) : idea.locked.add(f.id);
    lock.setAttribute('aria-pressed', String(idea.locked.has(f.id)));
  } else if (swap) {
    const j = +swap.dataset.swap, old = idea.features[j];
    const others = idea.features.filter((_, k) => k !== j);
    const next = chooseFeatures(idea.r, idea.features.length, others).find((f) => !others.includes(f) && f.id !== old.id);
    if (next) { idea.features[j] = next; idea.locked.delete(old.id); render(); }
  } else if (e.target.closest('[data-reroll]')) {
    const keep = idea.features.filter((f) => idea.locked.has(f.id));
    idea.features = chooseFeatures(idea.r, state.count, keep);
    render();
  } else if (e.target.closest('[data-copy]')) {
    const btn = e.target.closest('[data-copy]'), text = promptOf(idea);
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
      btn.textContent = ok ? 'Copied' : 'Copy failed';
    }
    setTimeout(() => (btn.textContent = 'Copy as prompt'), 1800);
  }
});

// ---------- start ----------
const fromLink = readHash();
syncForm();
generate(fromLink ? state.seed : undefined);
