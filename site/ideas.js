// Codex idea generator.
// Answers → pick building blocks → write a summary → compare against real products → score →
// over-generate, keep the best three. Everything runs client-side from data/*.json.
import { matchIdea } from './match.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// ---------- questions ----------
// [id, label, options] or [id, label, null, dependsOn, optionsByParent]
const AUDIENCES = [
  ['dog-owners', 'Dog owners', 'Good Boy', 'your dog'], ['cat-owners', 'Cat owners', 'Nine Lives', 'your cat'],
  ['new-parents', 'New parents', 'Night Feed', 'a sleepy cartoon baby'], ['students', 'Students', 'Late Bell', 'a study buddy'],
  ['climbers', 'Climbers', 'Crux', 'a tiny climber'], ['runners', 'Runners', 'Tempo', 'a running buddy'],
  ['gardeners', 'Gardeners', 'Seedling', 'your plants'], ['retro-gamers', 'Retro gamers', 'Continue', 'a pixel sidekick'],
  ['musicians', 'Musicians', 'Downbeat', 'a band mascot'], ['designers', 'Designers', 'Kerning', 'a studio cat'],
  ['small-business', 'Small business owners', 'Till', 'a shop cat'], ['kids', 'Kids', 'Pocket', 'a friendly monster'],
  ['older-adults', 'Older adults', 'Porch', 'a garden bird'], ['night-owls', 'Night-shift workers', 'Night Owl', 'an owl'],
  ['travellers', 'Travellers', 'Layover', 'a travel companion'], ['book-lovers', 'Book lovers', 'Dog-ear', 'a bookworm'],
];
const AUD = Object.fromEntries(AUDIENCES.map(([id, label, word, subject]) => [id, { label, word, subject }]));
const ARTS = [
  ['risograph', 'Risograph print', 'drawn in chunky risograph-print colours', 'Riso'], ['claymation', 'Claymation', 'modelled like soft claymation', 'Clay'],
  ['brutalist', 'Brutalist', 'set in raw, brutalist type with hard edges', 'Raw'], ['swiss', 'Swiss minimal', 'laid out on a strict Swiss grid', 'Grid'],
  ['pixel', 'Pixel art', 'drawn in crisp pixel art', 'Pixel'], ['watercolour', 'Watercolour', 'painted in loose watercolour washes', 'Wash'],
  ['y2k', 'Y2K chrome', 'finished in glossy Y2K chrome', 'Chrome'], ['blueprint', 'Blueprint', 'drawn like a technical blueprint', 'Blueprint'],
  ['collage', 'Paper collage', 'cut and pasted like a paper collage', 'Scrap'], ['lowpoly', 'Low-poly 3D', 'built in faceted low-poly 3D', 'Facet'],
  ['noir', 'Noir', 'lit in high-contrast noir', 'Noir'], ['papercraft', 'Papercraft', 'folded from paper craft', 'Paper'],
];
const ART = Object.fromEntries(ARTS.map(([id, label, phrase, word]) => [id, { label, phrase, word }]));
const AUDIENCE_Q = ['audience', 'Who it’s for', AUDIENCES.map(([id, label]) => [id, label])];
const ART_Q = ['art', 'Art style', ARTS.map(([id, label]) => [id, label])];
const STYLE = ['style', 'Personality', [['professional', 'Professional'], ['creative', 'Creative'], ['minimal', 'Minimal'], ['playful', 'Playful']]];
const DIM = ['dim', '2D or 3D', [['2d', '2D'], ['3d', '3D']]];

const KINDS = {
  app: { noun: 'app', steps: [
    AUDIENCE_Q,
    ['area', 'Area', [['finance', 'Money'], ['wellness', 'Health and wellness'], ['productivity', 'Productivity'], ['social', 'Friends and groups'], ['learning', 'Learning'], ['creative', 'Creativity'], ['fashion', 'Fashion and brands'], ['music', 'Music']]],
    ['appkind', 'What kind', null, 'area', {
      finance: [['budget', 'Budget'], ['subscriptions', 'Subscriptions'], ['investing', 'Investing tracker']],
      wellness: [['journal', 'Journal'], ['habits', 'Habit tracker'], ['sleep', 'Sleep'], ['screentime', 'Screen time'], ['fitness', 'Fitness'], ['meditation', 'Meditation']],
      productivity: [['notes', 'Notes'], ['tasks', 'Tasks'], ['focus', 'Focus timer'], ['planner', 'Planner']],
      social: [['events', 'Events'], ['groupchat', 'Group chat'], ['planner', 'Trip planner']],
      learning: [['flashcards', 'Flashcards'], ['language', 'Language'], ['explainer', 'Explainers']],
      creative: [['drawing', 'Drawing'], ['moodboard', 'Moodboard'], ['writing', 'Writing']],
      fashion: [['storefront', 'Storefront'], ['lookbook', 'Lookbook'], ['tryon', 'Virtual try-on']],
      music: [['player', 'Player'], ['visualizer', 'Visualizer'], ['sequencer', 'Beat maker']],
    }],
    STYLE, ART_Q,
    ['platform', 'Platform', [['mobile', 'Phone'], ['web', 'Web'], ['desktop', 'Desktop']]],
  ] },
  game: { noun: 'game', steps: [
    AUDIENCE_Q,
    ['genre', 'Genre', [['shooter', 'Shooter'], ['sandbox', 'Survival or sandbox'], ['puzzle', 'Puzzle'], ['racing', 'Racing'], ['strategy', 'Strategy'], ['rpg', 'RPG'], ['idle', 'Idle or incremental'], ['rhythm', 'Rhythm']]],
    ['tone', 'World', [['realistic', 'Realistic'], ['fantasy', 'Fantasy'], ['scifi', 'Sci-fi'], ['horror', 'Horror'], ['cozy', 'Cozy'], ['retro', 'Retro']]],
    DIM, ART_Q,
    ['feel', 'How reactive', [['calm', 'Calm'], ['responsive', 'Responsive'], ['chaotic', 'Everything reacts']]],
    ['platform', 'Where it runs', [['browser', 'In the browser'], ['download', 'A download'], ['mobile', 'On phones']]],
  ] },
  render: { noun: 'art piece', steps: [
    AUDIENCE_Q,
    ['subject', 'About', [['nature', 'Nature'], ['space', 'Space'], ['body', 'The body'], ['ocean', 'Water'], ['architecture', 'Architecture'], ['abstract', 'Abstract'], ['data', 'Real data']]],
    ['interact', 'People will', [['calm', 'Watch it'], ['responsive', 'Poke at it'], ['music', 'Play it with sound']]],
    ['mood', 'Mood', [['calm', 'Calm'], ['eerie', 'Eerie'], ['playful', 'Joyful'], ['intense', 'Intense']]],
    DIM, ART_Q,
  ] },
  portfolio: { noun: 'portfolio piece', steps: [
    ['prove', 'It should prove', [['graphics', 'Graphics skill'], ['systems', 'Engineering depth'], ['design', 'Design taste'], ['ai', 'AI know-how']]],
    ['time', 'Time you have', [['weekend', 'A weekend'], ['week', 'A week'], ['month', 'A month or more']]],
    AUDIENCE_Q, DIM, STYLE, ART_Q,
  ] },
  website: { noun: 'website', steps: [
    ['for', 'For', [['launch', 'A product launch'], ['brand', 'A brand or store'], ['personal', 'Me'], ['event', 'An event']]],
    AUDIENCE_Q, STYLE, ART_Q,
    ['signature', 'Signature moment', [['scroll', 'Scroll storytelling'], ['cursor', 'Cursor play'], ['3d', '3D'], ['music', 'Sound']]],
  ] },
  tool: { noun: 'tool', steps: [
    ['for', 'For', [['small-business', 'Small businesses'], ['creators', 'Creators'], ['freelancers', 'Freelancers'], ['developers', 'Developers'], ['designers', 'Designers'], ['musicians', 'Musicians'], ['researchers', 'Researchers'], ['security', 'Security work']]],
    ['form', 'Form', [['web', 'Web app'], ['cli', 'Command line'], ['desktop', 'Desktop app']]],
    STYLE, ART_Q,
  ] },
};

// "every purchase", "every shot" … the unit of action that block signatures hang off
const UNIT = {
  budget: 'every purchase', subscriptions: 'every renewal', investing: 'every trade', journal: 'every entry', habits: 'every check-in',
  sleep: 'every night', screentime: 'every hour on your phone', fitness: 'every workout', meditation: 'every session', notes: 'every note',
  tasks: 'every finished task', focus: 'every focus session', planner: 'every plan', events: 'every RSVP', groupchat: 'every message',
  flashcards: 'every card you learn', language: 'every new word', explainer: 'every step', drawing: 'every stroke', moodboard: 'every image you pin',
  writing: 'every page', storefront: 'every product', lookbook: 'every outfit', tryon: 'every try-on', player: 'every song', visualizer: 'every beat',
  sequencer: 'every loop', finance: 'every purchase', wellness: 'every check-in', productivity: 'every task', social: 'every message',
  learning: 'every lesson', creative: 'every stroke', fashion: 'every piece', music: 'every track',
  shooter: 'every shot', sandbox: 'every block you place', puzzle: 'every solved room', racing: 'every lap', strategy: 'every order you give',
  rpg: 'every choice', idle: 'every upgrade', rhythm: 'every beat', game: 'every action',
  render: 'every touch', portfolio: 'every interaction', website: 'every scroll', tool: 'every file you open',
  'small-business': 'every booking', creators: 'every sale', freelancers: 'every invoice',
};
const KIND_WORD = {
  budget: 'budgeting', subscriptions: 'subscription', investing: 'investing', journal: 'journaling', habits: 'habit', sleep: 'sleep',
  screentime: 'screen-time', fitness: 'fitness', meditation: 'meditation', notes: 'notes', tasks: 'to-do', focus: 'focus', planner: 'planning',
  events: 'events', groupchat: 'group chat', flashcards: 'flashcard', language: 'language-learning', explainer: 'explainer', drawing: 'drawing',
  moodboard: 'moodboard', writing: 'writing', storefront: 'shopping', lookbook: 'lookbook', tryon: 'try-on', player: 'music', visualizer: 'music visualiser',
  sequencer: 'beat-making', finance: 'money', wellness: 'wellness', productivity: 'productivity', social: 'social', learning: 'learning',
  creative: 'creative', fashion: 'fashion', music: 'music',
};
const TITLE_NOUN = {
  budget: 'Budget', subscriptions: 'Subs', investing: 'Portfolio', journal: 'Journal', habits: 'Habits', sleep: 'Sleep', screentime: 'Screen Time',
  fitness: 'Fit', meditation: 'Calm', notes: 'Notes', tasks: 'Tasks', focus: 'Focus', planner: 'Plans', events: 'Invites', groupchat: 'Chat',
  flashcards: 'Cards', language: 'Words', explainer: 'Explained', drawing: 'Sketchbook', moodboard: 'Board', writing: 'Pages', storefront: 'Store',
  lookbook: 'Lookbook', tryon: 'Fitting Room', player: 'Player', visualizer: 'Visuals', sequencer: 'Beats',
};
// The smallest version that is already fun — step one of "First weekend"
const CORE = {
  budget: 'log a purchase and see what is left this month', subscriptions: 'add a subscription and see its next renewal',
  investing: 'add a holding and see its value today', journal: 'write an entry and scroll back through past ones',
  habits: 'check off a habit and see the streak', sleep: 'log a night and see the week', screentime: 'enter today’s screen time and see the trend',
  fitness: 'log a workout and see the week', meditation: 'start and finish a timed session', notes: 'write, save and search notes',
  tasks: 'add, finish and clear tasks', focus: 'run a 25-minute timer', planner: 'add a plan to a day', events: 'create an event and RSVP to it',
  groupchat: 'send messages between two tabs', flashcards: 'flip through a deck and mark cards known', language: 'learn and quiz five words',
  explainer: 'explain one idea in three interactive steps', drawing: 'draw strokes and undo them', moodboard: 'drop images onto a board',
  writing: 'write and save a page', storefront: 'show three products and add one to a bag', lookbook: 'show outfits in a grid',
  tryon: 'overlay one item on a photo', player: 'play and skip tracks', visualizer: 'react to one audio file', sequencer: 'loop a four-step beat',
  shooter: 'move, aim and hit a target', sandbox: 'place and remove blocks', puzzle: 'solve one hand-made room', racing: 'drive one lap against a timer',
  strategy: 'give one unit an order', rpg: 'walk, talk to one character and make a choice', idle: 'click to earn and buy one upgrade',
  rhythm: 'hit notes in time to one song', game: 'move a character and do one thing', render: 'render the scene and respond to one input',
  portfolio: 'get one scene rendering smoothly', launch: 'lay out the hero and three sections', brand: 'lay out the home page and one product',
  personal: 'lay out the home page and three projects', event: 'lay out the event page with a date and RSVP', website: 'lay out the home page',
  security: 'load one file and show its contents', developers: 'run the tool on one input', designers: 'take one input and show one output',
  musicians: 'play one sound', researchers: 'load one dataset and show it', tool: 'run it on one input',
  'small-business': 'take one booking and send one invoice', creators: 'publish one page with one thing to buy', freelancers: 'send one invoice and mark it paid',
};
const YOURS = {
  app: ['Write {title}’s first screen yourself, in your own voice{forAud}.', 'Decide the one feeling {title} should leave {audOr} with, and cut anything that doesn’t serve it.', 'Draw {title}’s {artOr} style on one page before you build any screen.', 'Write three things {character} would say in the app.'],
  game: ['Write {title}’s world history in five sentences before any code.', 'Invent one rule only {title} has, and build every level around it.', 'Pick four colours for {title}{artIn} and never use a fifth.', 'Decide what {title} takes away when the player fails.'],
  render: ['Tie {title} to one real place or memory, and say which in its caption.', 'Hide one interaction in {title} that surprises people.', 'Write a two-line statement for {title} before building.'],
  portfolio: ['Write the case-study line first: “I built {title} to prove …”.', 'Record a 20-second clip of {title}’s best moment.', 'Write up the hardest bug in {title} and how you fixed it.'],
  website: ['Write {title}’s one-sentence promise before any design.', 'Make or shoot {title}’s imagery yourself{artIn}.', 'Decide the one action a visitor should take on {title}.'],
  tool: ['Describe the {audOr} who uses {title} and their worst day.', 'Make {title}’s defaults the ones you use yourself.', 'Write {title}’s README before the code.'],
};
const ADJ = {
  realistic: 'Iron', fantasy: 'Emberlit', scifi: 'Orbital', horror: 'Hollow', cozy: 'Sunday', retro: 'Arcade', calm: 'Quiet', eerie: 'Pale',
  playful: 'Pocket', intense: 'Molten', professional: 'Clear', creative: 'Painted', minimal: 'Plain',
};
const TIME_BUDGET = { weekend: 5, week: 9, month: 16 };
const KIND_BUDGET = { app: 8, game: 10, render: 7, portfolio: 8, website: 7, tool: 8 };
const WEIGHTS = { clarity: 0.2, differentiation: 0.25, coherence: 0.15, buildability: 0.15, references: 0.1, ownership: 0.1, delight: 0.05 };
const CRIT_LABEL = { clarity: 'Clarity', differentiation: 'Differentiation', coherence: 'Coherence', buildability: 'Buildability', references: 'References', ownership: 'Ownership', delight: 'Delight' };

const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const SHUFFLE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h3l6 8h3M2 12h3l2-2.7M9 6.7 11 4h3M12 2l2 2-2 2M12 10l2 2-2 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------- seeded randomness so ideas can be shared by link ----------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function weighted(r, items, weight) {
  const total = items.reduce((s, x) => s + weight(x), 0);
  if (total <= 0) return null;
  let t = r() * total;
  for (const x of items) { t -= weight(x); if (t <= 0) return x; }
  return items[items.length - 1];
}

// ---------- data ----------
let index, features, comps, byRepo, MONEY;
try {
  const load = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
  const [i, f, c, m] = await Promise.all([load('data/index.json'), load('data/features.json'), load('data/comps.json'), load('data/money.json')]);
  index = i.repos; features = f.features; comps = c.domains; MONEY = m;
  byRepo = new Map(index.map((r) => [r.repo, r]));
} catch {
  $('#ideas').innerHTML = '<p class="empty">The archive could not be loaded. Check your connection and reload the page.</p>';
  $('#status').textContent = 'The archive could not be loaded.';
  throw new Error('Codex: failed to load data');
}

// ---------- state ----------
// Opens on the owner's own example, fully answered, so the first view is a real result.
const DEFAULT = { goal: 'fun', kind: 'app', answers: { audience: 'dog-owners', area: 'finance', appkind: 'budget', style: 'playful', art: 'risograph', platform: 'mobile' }, twist: '', count: 4 };
const state = { goal: DEFAULT.goal, kind: DEFAULT.kind, answers: { ...DEFAULT.answers }, twist: DEFAULT.twist, count: DEFAULT.count, seed: 1 };

const MODEL_Q = ['model', 'How it earns', [['subscription', 'Monthly subscription'], ['onetime', 'One-time purchase'], ['iap', 'In-app purchases'], ['ads', 'Ads'], ['b2b', 'Business subscription'], ['marketplace', 'Commission on sales'], ['affiliate', 'Affiliate links']]];
const TARGET_Q = ['target', 'Monthly goal', [['500', '$500 a month'], ['1000', '$1,000 a month'], ['3000', '$3,000 a month'], ['10000', '$10,000 a month']]];
// In money mode the business questions come right after who it's for, because they shape everything after.
function stepsOf(kind = state.kind) {
  const steps = KINDS[kind].steps;
  if (state.goal !== 'money') return steps;
  const at = steps.findIndex(([id]) => id === 'audience') + 1;
  return [...steps.slice(0, at), MODEL_Q, TARGET_Q, ...steps.slice(at)];
}
const money = () => state.goal === 'money';
function optionsOf([, , options, dependsOn, optionsBy]) { return dependsOn ? optionsBy[state.answers[dependsOn]] ?? [] : options; }
function valid() {
  const out = {};
  for (const step of stepsOf()) {
    const v = state.answers[step[0]];
    if (v && optionsOf(step).some(([o]) => o === v)) out[step[0]] = v;
  }
  return out;
}
function labelOf(id) {
  const step = stepsOf().find(([s]) => s === id);
  return step ? optionsOf(step).find(([v]) => v === state.answers[id])?.[1] ?? '' : '';
}
function briefTags() {
  const a = valid();
  return new Set([...Object.values(a), state.kind, ...(money() ? ['money'] : [])]);
}
function domainOf() {
  const a = valid();
  return ({ app: a.appkind || a.area, game: a.genre || 'game', render: 'render', portfolio: 'portfolio', website: a.for || 'website', tool: a.for || 'tool' })[state.kind];
}

// ---------- choosing pieces ----------
function candidates(tags) {
  const a = valid();
  return features.filter((f) => f.kinds.includes(state.kind)
    && !(a.dim && f.dims && !f.dims.includes(a.dim))
    && !(f.avoid ?? []).some((t) => tags.has(t)));
}
function baseWeight(f, tags) {
  const hits = f.tags.filter((t) => tags.has(t)).length;
  const w = (hits ? (1 + 3 * hits) ** 2 : 0.6) * (0.7 + (f.delight ?? 5) / 10);
  return money() ? w * (4 - (f.cost ?? 2)) / 2.5 : w; // money mode favours what's cheap to build and run
}
// How well a piece fits this brief: 1 if it matches the domain, audience or art style; 0.4 if it only
// matches a generic answer (personality, mood, 2D/3D…); 0 if it matches nothing.
const GENERIC = new Set(['style', 'feel', 'dim', 'platform', 'time', 'target', 'subscription', 'onetime', 'iap', 'ads', 'marketplace', 'affiliate']);
function relevance(f) {
  const a = valid();
  const specific = new Set(Object.entries(a).filter(([k]) => !GENERIC.has(k)).map(([, v]) => v));
  const generic = new Set([...Object.entries(a).filter(([k]) => GENERIC.has(k)).map(([, v]) => v), state.kind]);
  if (f.tags.some((t) => specific.has(t))) return 1;
  return f.tags.some((t) => generic.has(t)) ? 0.4 : 0;
}
const needsFoundation = () => state.kind === 'game' || ((state.kind === 'render' || state.kind === 'portfolio') && valid().dim === '3d');

// Pick n pieces: one foundation where needed, then spread across roles, respecting exclusive groups
// (one world structure, one render style) and boosting pieces that pair well with what's chosen.
function choose(r, n, keep = [], exclude = []) {
  const tags = briefTags(), pool = candidates(tags).filter((f) => !exclude.includes(f.id)), chosen = [...keep];
  const blocked = (f) => chosen.some((c) => c.id === f.id || (f.exclusive && c.exclusive === f.exclusive));
  if (needsFoundation() && !chosen.some((c) => c.role === 'foundation')) {
    const f = weighted(r, pool.filter((x) => x.role === 'foundation' && !blocked(x)), (x) => baseWeight(x, tags));
    if (f && chosen.length < n) chosen.unshift(f);
  }
  while (chosen.length < n) {
    const roles = new Set(chosen.map((c) => c.role));
    const wildcards = chosen.filter((c) => c.role !== 'foundation' && relevance(c) < 1).length;
    let rest = pool.filter((x) => x.role !== 'foundation' && !blocked(x));
    // Keep ideas coherent: at most one piece that only loosely fits the brief, unless nothing else is left.
    if (wildcards >= 1 && rest.some((x) => relevance(x) === 1)) rest = rest.filter((x) => relevance(x) === 1);
    const fresh = rest.some((x) => !roles.has(x.role));
    const f = weighted(r, rest, (x) => baseWeight(x, tags)
      * (fresh && roles.has(x.role) ? 0.25 : 1)
      * (chosen.some((c) => c.pairsWell?.includes(x.id)) ? 2.5 : 1));
    if (!f) break;
    chosen.push(f);
  }
  return chosen;
}

// Pinned repos first, then the archive's best live match, so new finds show up.
function refsFor(f) {
  const out = f.repos.map((id) => byRepo.get(id)).filter(Boolean).slice(0, 2);
  const extra = matchIdea(index, f.query).map((x) => x.r).find((r) => !out.includes(r) && !f.repos.includes(r.repo));
  if (extra && (out.length < 2 || f.repos.length === 0)) out.push(extra);
  return out.slice(0, 3);
}

// ---------- writing ----------
const listJoin = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')}${xs.length > 2 ? ',' : ''} and ${xs.at(-1)}`;
function unit() { const a = valid(); return UNIT[a.appkind] ?? UNIT[a.area] ?? UNIT[a.genre] ?? UNIT[a.for] ?? UNIT[state.kind] ?? 'every action'; }
function character() { const a = valid(); return AUD[a.audience]?.subject ?? ({ app: 'a small character who lives in the app', game: 'a small companion character', render: 'a small creature' })[state.kind] ?? 'a small character'; }
function sig(f) {
  if (!f.signature) return null;
  return f.signature.replaceAll('{each}', unit()).replaceAll('{subject}', character());
}
function pred(f) { return f.signature ? sig(f).replace(unit(), '').trim() : null; }
function signatureBlocks(idea) {
  return idea.features.filter((f) => f.role !== 'foundation' && f.signature)
    .sort((x, y) => relevance(y) - relevance(x) || (y.delight ?? 0) - (x.delight ?? 0));
}
function ambientBlocks(idea) { return idea.features.filter((f) => f.role !== 'foundation' && !f.signature && f.ambient); }

function titleOf(idea, rank = 0, taken = []) {
  const a = valid();
  const lead = AUD[a.audience]?.word ?? ART[a.art]?.word ?? ADJ[a.tone || a.mood || a.style] ?? 'Open';
  if (rank === 0 && state.kind === 'app' && TITLE_NOUN[a.appkind]) return `${lead} ${TITLE_NOUN[a.appkind]}`;
  const order = [...signatureBlocks(idea), ...ambientBlocks(idea), ...idea.features.filter((x) => x.role !== 'foundation')];
  for (const f of order) { const t = `${lead} ${f.noun}`; if (!taken.includes(t)) return t; }
  return `${lead} ${order[0]?.noun ?? 'Project'} ${rank + 1}`;
}

function kindPhrase() {
  const a = valid(), L = (id) => labelOf(id).toLowerCase();
  switch (state.kind) {
    case 'app': {
      const word = KIND_WORD[a.appkind] ?? KIND_WORD[a.area] ?? '';
      return `A ${a.style ? `${L('style')} ` : ''}${word ? `${word} ` : ''}app`;
    }
    case 'game': {
      const dim = a.dim ? `${a.dim.toUpperCase()} ` : '';
      const genre = a.genre ? { sandbox: 'survival sandbox game', idle: 'idle game', rpg: 'RPG' }[a.genre] ?? `${L('genre')} game` : 'game';
      return `A ${dim}${genre}`;
    }
    case 'render': return `An interactive ${a.dim ? `${a.dim.toUpperCase()} ` : ''}piece${a.subject ? ` about ${L('subject')}` : ''}`;
    case 'portfolio': return `A ${{ weekend: 'weekend ', week: 'one-week ', month: 'month-long ' }[a.time] ?? ''}portfolio piece${a.prove ? ` that proves ${L('prove')}` : ''}`;
    case 'website': return `A ${a.style ? `${L('style')} ` : ''}website${a.for ? ` for ${L('for')}` : ''}`;
    case 'tool': return `A ${{ cli: 'command-line', web: 'web', desktop: 'desktop' }[a.form] ?? ''} tool${a.for ? ` for ${L('for')}` : ''}`.replace('A  ', 'A ');
  }
}

// The 2–3 sentence summary a founder could put on a slide:
// what it is and who it's for → the signature action → how it looks and what it's built around.
function summaryOf(idea) {
  const { core } = coreSplit(idea), inCore = (f) => core.includes(f);
  const a = valid(), acts = signatureBlocks(idea).filter(inCore), amb = ambientBlocks(idea).filter(inCore).map((f) => f.ambient);
  const aud = AUD[a.audience] ? ` for ${AUD[a.audience].label.toLowerCase()}` : '';
  const world = state.kind === 'game' && a.tone ? ` set in a ${labelOf('tone').toLowerCase()} world` : '';
  const out = [];
  out.push(`${kindPhrase()}${aud}${world}${acts[0] ? `, where ${sig(acts[0])}` : ''}.`);
  const also = (p) => /^(is|can|has|gets) /.test(p) ? p.replace(/^(\w+) /, '$1 also ') : `also ${p}`;
  if (acts[1]) out.push(`Each one ${also(pred(acts[1]))}${acts[2] ? `, and ${pred(acts[2])}` : ''}.`);
  const art = ART[a.art]?.phrase, twist = state.twist.trim().replace(/[.!]+$/, '');
  const looks = [art, ...amb].filter(Boolean).slice(0, 3);
  if (looks.length) out.push(`It’s ${listJoin(looks)}.`);
  if (twist) out.push(`The twist: ${twist}.`);
  if (money()) out.push(`It earns from ${moneyOf(idea).earns}.`);
  return out.join(' ');
}

// ---------- differentiation against real products ----------
function traitsOf(idea) { return [...new Set(idea.features.flatMap((f) => f.traits ?? [f.id]))]; }
function compare(idea) {
  const domain = domainOf();
  const list = domain && comps[domain] ? comps[domain] : Object.values(comps).flat();
  const mine = new Set(traitsOf(idea));
  let best = null;
  for (const c of list) {
    const theirs = new Set(c.traits);
    const shared = [...mine].filter((t) => theirs.has(t));
    const overlap = (shared.length + 1) / (new Set([...mine, ...theirs]).size + 1); // +1: same domain is itself a shared trait
    if (!best || overlap > best.overlap) best = { comp: c, shared, overlap };
  }
  const known = new Set(list.flatMap((c) => c.traits));
  // Novelty only counts when it comes from a piece that belongs in this brief; a random extra is noise.
  const novel = [...new Set(idea.features.filter((f) => f.role !== 'foundation' && relevance(f) >= 0.4)
    .flatMap((f) => f.traits ?? [f.id]))].filter((t) => !known.has(t));
  const reskin = novel.length === 0 || (best.overlap >= 0.6 && novel.length < 2);
  const verdict = reskin ? 'Reskin' : best.overlap < 0.25 && novel.length >= 2 ? 'New' : 'Meaningful twist';
  return { ...best, novel, reskin, verdict, domain };
}

function whyOf(idea, cmp) {
  const a = valid();
  // Explain the difference with the first new thing the summary actually describes (core pieces, in summary order).
  const { core } = coreSplit(idea);
  const lead = [...signatureBlocks(idea), ...ambientBlocks(idea)].filter((f) => core.includes(f) && f.angle && (f.traits ?? []).some((t) => cmp.novel.includes(t)))[0];
  const aud = AUD[a.audience] ? `, for ${AUD[a.audience].label.toLowerCase()}` : '';
  if (money() && a.audience && (cmp.reskin || !lead)) return `${cmp.comp.name} ${cmp.comp.does}; this does it for ${AUD[a.audience].label.toLowerCase()}${MONEY.audiences[a.audience]?.note ? ` (${MONEY.audiences[a.audience].note})` : ''}.`;
  if (cmp.reskin || !lead) return `This is close to ${cmp.comp.name}, which ${cmp.comp.does}. Swap a piece to make it your own.`;
  return `${cmp.comp.name} ${cmp.comp.does}; this ${lead.angle}${aud}.`;
}

// ---------- money plan (money mode) ----------
const DEFAULT_PRICE = { subscription: 5, onetime: 10, iap: 3, ads: 0.3, b2b: 29, marketplace: 2, affiliate: 1 };
const fmt$ = (n) => n >= 1 ? `$${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;
const fmtN = (n) => n >= 10000 ? `${Math.round(n / 1000).toLocaleString()},000` : n >= 1000 ? `${(Math.round(n / 100) * 100).toLocaleString()}` : `${Math.ceil(n)}`;
function moneyOf(idea) {
  const a = valid(), prof = MONEY.domains[domainOf()] ?? MONEY.domains[state.kind] ?? MONEY.domains.app;
  const aud = MONEY.audiences[a.audience], audLabel = AUD[a.audience]?.label;
  const modelId = a.model || prof.models[0], model = MONEY.models[modelId];
  const price = prof.price[modelId] ?? DEFAULT_PRICE[modelId], target = +a.target || 3000;
  const { core } = coreSplit(idea), paid = core.filter((f) => f.signature || f.ambient).slice(0, 2).map((f) => f.name.toLowerCase());
  const coreJob = CORE[a.appkind] ?? CORE[a.genre] ?? CORE[a.for] ?? CORE[state.kind];
  const priceLabel = { subscription: `${fmt$(price)} a month`, b2b: `${fmt$(price)} a month per business`, onetime: `${fmt$(price)} once`,
    iap: `about ${fmt$(price)} per purchase`, ads: `roughly ${fmt$(price)} per active user a month`, marketplace: `a cut worth about ${fmt$(price)} per sale`,
    affiliate: `about ${fmt$(price)} per referred purchase` }[modelId];
  const earns = { subscription: `a ${fmt$(price)}-a-month subscription`, b2b: `a ${fmt$(price)}-a-month business plan`, onetime: `a one-time ${fmt$(price)} purchase`,
    iap: `in-app purchases of about ${fmt$(price)}`, ads: 'ads', marketplace: 'a cut of every sale', affiliate: `affiliate links to ${aud?.affiliate ?? 'things it recommends'}` }[modelId];
  const payer = audLabel ?? (state.kind === 'tool' && a.for ? labelOf('for') : null);
  const who = `${payer ?? 'People'} ${/business/i.test(payer ?? '') ? 'that' : 'who'} ${prof.pain}${aud?.note ? `. ${cap(aud.note)}` : ''}.`;
  const free = {
    subscription: `Free: ${coreJob}. Paid: ${paid.length ? listJoin(paid) : 'the full experience'}, plus full history.`,
    b2b: `Free 14-day trial of everything, then ${priceLabel}.`,
    onetime: `Free demo: ${coreJob}. Paid: the full version${paid.length ? ` with ${listJoin(paid)}` : ''}.`,
    iap: `Free: the whole core. Paid: ${state.kind === 'game' ? 'extra levels and cosmetics' : 'extra packs and themes'}, never power.`,
    ads: 'Everything is free. Ads show between sessions, never in the middle of one.',
    marketplace: 'Free to browse and list; the cut comes out of each sale.',
    affiliate: `Free for everyone; recommendations link to ${aud?.affiliate ?? 'products'} people would buy anyway.`,
  }[modelId];
  const shareable = idea.features.some((f) => ['daily', 'sketch', 'sync', 'mascot'].includes(f.id));
  const channels = [...(aud?.channels ?? []).slice(0, 2), ...prof.channels.slice(0, 2)];
  const find = `${cap(listJoin([...new Set(channels)].slice(0, 3)))}.${shareable ? ' Something shareable is built in, so users bring users.' : ''}`;
  let maths;
  const conv = model.conversion;
  if (modelId === 'subscription' || modelId === 'b2b') {
    const payers = target / price, free = payers / conv;
    maths = `To make ${fmt$(target)} a month: about ${fmtN(payers)} ${modelId === 'b2b' ? 'paying businesses' : 'subscribers'} at ${fmt$(price)}. At a typical ${Math.round(conv * 100)}% trial-to-paid rate, that's about ${fmtN(free)} ${modelId === 'b2b' ? 'businesses trying it' : 'active free users'}.`;
  } else if (modelId === 'onetime') {
    maths = `To make ${fmt$(target)} a month: about ${fmtN(target / price)} sales a month at ${fmt$(price)}. If ${Math.round(conv * 100)}% of visitors buy, that's about ${fmtN(target / price / conv)} visitors every month.`;
  } else if (modelId === 'iap') {
    maths = `To make ${fmt$(target)} a month: about ${fmtN(target / price)} purchases a month. If ${Math.round(conv * 100)}% of players buy something, that's about ${fmtN(target / price / conv)} monthly players.`;
  } else if (modelId === 'ads') {
    maths = `To make ${fmt$(target)} a month from ads: about ${fmtN(target / price)} monthly active users, coming back often.`;
  } else if (modelId === 'marketplace') {
    maths = `To make ${fmt$(target)} a month: about ${fmtN(target / price)} sales a month through the app.`;
  } else {
    maths = `To make ${fmt$(target)} a month: about ${fmtN(target / price)} referred purchases a month, which needs about ${fmtN(target / price / conv)} visitors.`;
  }
  const watch = `${model.risk} ${model.cut}${a.audience === 'kids' ? ' Child-privacy rules (such as COPPA in the US) apply.' : ''}`;
  return { modelId, model, price, target, earns, priceLabel, who, free, find, maths, watch, prof, aud, shareable, fits: prof.models.includes(modelId) };
}

// ---------- scoring (the review rubric, estimated from data) ----------
const clamp = (x) => Math.max(0, Math.min(10, x));
function scoreOf(idea) {
  const a = valid(), tags = briefTags(), cmp = compare(idea);
  const { core, later } = coreSplit(idea);
  const body = idea.features.filter((f) => f.role !== 'foundation'), n = core.length;
  const s = {};
  // Clarity: few pieces, a named audience and a named look
  const look = a.art || a.tone || a.mood;
  s.clarity = [clamp(10 - Math.max(0, n - 3) * 0.9 - (a.audience ? 0 : 1.5) - (look ? 0 : 1) - (body.some((f) => !f.signature) ? 0.5 : 0)),
    `${n} core piece${n === 1 ? '' : 's'} to explain${later.length ? ` (${later.length} more for later)` : ''}, ${a.audience ? 'a named audience' : 'no audience set'}, ${look ? 'a named look' : 'no art style or mood set'}.`];
  s.clarity[0] = clamp(s.clarity[0] - later.length * 0.2);
  // Differentiation: overlap with the closest real product, and traits none of them have
  const diff = cmp.reskin ? Math.min(4, 2 + 4 * (1 - cmp.overlap)) : 2 + 6 * (1 - cmp.overlap) + Math.min(2, cmp.novel.length * 0.7) + (a.audience ? 0.5 : 0);
  s.differentiation = [clamp(diff), `Closest: ${cmp.comp.name} (shares ${cmp.shared.length ? cmp.shared.join(', ') : 'only the category'}, ${Math.round(cmp.overlap * 100)}% overlap). New here: ${cmp.novel.length ? cmp.novel.join(', ') : 'nothing'}.`];
  // Coherence: pieces that match the brief, and pieces that pair well
  const rel = body.map(relevance), avgRel = rel.length ? rel.reduce((x, y) => x + y, 0) / rel.length : 0;
  const matched = rel.filter((x) => x === 1).length;
  let pairs = 0;
  for (let i = 0; i < idea.features.length; i++) for (let j = i + 1; j < idea.features.length; j++) if (idea.features[i].pairsWell?.includes(idea.features[j].id)) pairs++;
  s.coherence = [clamp(2 + 7 * avgRel + Math.min(1.5, pairs * 0.5) - Math.max(0, body.length - 6) * 0.3),
    `${matched} of ${n} pieces fit the brief directly${rel.some((x) => x === 0.4) ? `, ${rel.filter((x) => x === 0.4).length} only loosely` : ''}${rel.some((x) => x === 0) ? `, ${rel.filter((x) => x === 0).length} not at all` : ''}${pairs ? `; ${pairs} strong pairing${pairs > 1 ? 's' : ''}` : ''}.`];
  // Buildability: build cost against the time budget
  const base = idea.features.filter((f) => f.role === 'foundation');
  const cost = [...base, ...core].reduce((t, f) => t + (f.cost ?? 2), 0), budget = TIME_BUDGET[a.time] ?? KIND_BUDGET[state.kind];
  const laterCost = later.reduce((t, f) => t + (f.cost ?? 2), 0);
  s.buildability = [clamp(10 - Math.max(0, cost - budget) * 1.2 - laterCost * 0.1), `Core build cost ${cost} against a solo budget of ${budget}${a.time ? ` for ${labelOf('time').toLowerCase()}` : ''}${later.length ? `; ${laterCost} more once the core works` : ''}.`];
  // References: usefulness of each piece's best archive reference
  const refScores = idea.features.map((f) => {
    if (!f.repos.length) return 3.5; // only a loose live match, not a vetted reference
    const r = refsFor(f)[0]; return r ? Math.min(9.5, (r.score ?? 40) / 8) : 3;
  });
  const missing = idea.features.filter((f) => !f.repos.length).length;
  s.references = [clamp(refScores.reduce((x, y) => x + y, 0) / refScores.length),
    `Average quality of each piece’s best reference${missing ? `; ${missing} piece${missing > 1 ? 's have' : ' has'} no vetted reference yet` : ''}.`];
  // Ownership: room for the maker's own story, look and voice
  s.ownership = [clamp(4 + (state.twist.trim() ? 3 : 0) + (a.art ? 1.5 : 0) + (a.audience ? 1 : 0) + (['game', 'render'].includes(state.kind) ? 0.5 : 0)),
    `${state.twist.trim() ? 'Your twist is in. ' : 'No twist of your own yet. '}${a.art ? 'Art direction chosen.' : 'Art direction open.'}`];
  // Delight: the best single moment
  const star = [...idea.features].sort((x, y) => (y.delight ?? 0) - (x.delight ?? 0))[0];
  s.delight = [clamp((star?.delight ?? 4) + (pairs ? 0.5 : 0)), `Best moment: ${star?.name.toLowerCase() ?? 'none'}.`];
  if (money()) return moneyScore(idea, s, cmp);
  let overall = Object.entries(WEIGHTS).reduce((t, [k, w]) => t + s[k][0] * w, 0);
  if (cmp.reskin) overall = Math.min(overall, 5);
  return { overall: Math.round(overall * 10) / 10, crit: s, cmp };
}

// Money mode: a proven model aimed at a named niche is a strength, not a reskin.
const MONEY_WEIGHTS = { pay: 0.25, demand: 0.15, wedge: 0.15, reach: 0.15, recurring: 0.1, buildability: 0.1, clarity: 0.1 };
Object.assign(CRIT_LABEL, { pay: 'Willingness to pay', demand: 'Proof of demand', wedge: 'Niche wedge', reach: 'Reach', recurring: 'Recurring income' });
function moneyScore(idea, s, cmp) {
  const a = valid(), m = moneyOf(idea), m$ = {};
  const pay = m.prof.wtp + (m.aud?.wtp ?? 0) + (m.fits ? 0.5 : -1.5);
  m$.pay = [clamp(pay), `${m.prof.wtp}/10 for this category${m.aud ? `, ${m.aud.wtp >= 0 ? '+' : ''}${m.aud.wtp} for ${AUD[a.audience].label.toLowerCase()}` : ''}; ${m.fits ? 'a model that suits it' : 'an unusual model for this category'}.`];
  const n = (comps[domainOf()] ?? []).length;
  m$.demand = [clamp([4, 6, 7.5, 8.5][Math.min(3, n)] + (cmp.reskin ? 0.5 : 0)), n ? `${n} known product${n > 1 ? 's' : ''} already earn here (closest: ${cmp.comp.name}).` : 'No well-known products in this exact space: unproven demand.'];
  m$.wedge = [clamp(3 + (a.audience ? 3 : 0) + (cmp.reskin ? 0 : 2) + (a.art ? 0.5 : 0) + (state.twist.trim() ? 1 : 0)),
    `${a.audience ? `Aimed at ${AUD[a.audience].label.toLowerCase()}` : 'No niche named'}; ${cmp.reskin ? `same model as ${cmp.comp.name}` : `different from ${cmp.comp.name} in how it works`}.`];
  m$.reach = [clamp((m.aud ? 7 : 5) + (m.shareable ? 1.5 : 0) - (m.modelId === 'ads' ? 1.5 : 0)), `${m.aud ? 'A community you can find' : 'No specific community to reach'}${m.shareable ? '; users share it' : ''}${m.modelId === 'ads' ? '; ads need a lot of traffic' : ''}.`];
  const hooks = idea.features.filter((f) => f.tags.includes('money')).length;
  m$.recurring = [clamp((m.model.recurring ? 8 : 4) + Math.min(1.5, hooks * 0.5)), `${m.model.recurring ? 'Earns every month' : 'Earns once per buyer'}${hooks ? `; ${hooks} piece${hooks > 1 ? 's' : ''} that bring people back` : ''}.`];
  m$.buildability = s.buildability; m$.clarity = s.clarity;
  const overall = Object.entries(MONEY_WEIGHTS).reduce((t, [k, w]) => t + m$[k][0] * w, 0);
  const copy = cmp.reskin && !a.audience;
  const verdict = copy ? 'Copy' : cmp.reskin ? 'Proven model, new niche' : cmp.verdict;
  return { overall: Math.round((copy ? Math.min(overall, 5) : overall) * 10) / 10, crit: m$, cmp: { ...cmp, reskin: copy, verdict }, money: m };
}

// ---------- ideas ----------
function makeIdea(seed) {
  const r = rng(seed);
  return { seed, r, features: choose(r, state.count), locked: new Set(), yours: [pick(r, [0, 1, 2]), pick(r, [0, 1, 2, 3])] };
}
function evaluate(idea, rank = 0, taken = []) {
  const score = scoreOf(idea);
  return { idea, score, title: titleOf(idea, rank, taken), summary: summaryOf(idea), why: whyOf(idea, score.cmp) };
}
const overlapShare = (x, y) => x.features.filter((f) => y.features.some((g) => g.id === f.id)).length / Math.max(1, Math.min(x.features.length, y.features.length));

// Quality gate: over-generate, score, never show a reskin, keep three distinct ideas.
function generateSet(seed) {
  const pool = Array.from({ length: 12 }, (_, i) => evaluate(makeIdea(seed + i * 7919))).filter((e) => e.idea.features.length);
  pool.sort((x, y) => y.score.overall - x.score.overall);
  const shown = [];
  const same = (x, y) => x.idea.features.length === y.idea.features.length && overlapShare(x.idea, y.idea) === 1;
  const passes = [
    [(e) => !e.score.cmp.reskin && e.score.overall >= 6, 0.6], [(e) => !e.score.cmp.reskin && e.score.overall >= 6, 0.8],
    [(e) => !e.score.cmp.reskin, 0.8], [(e) => !e.score.cmp.reskin, 1.01],
  ]; // never show a reskin: better two good ideas than three with a copy
  for (const [pass, maxOverlap] of passes) {
    for (const e of pool) {
      if (shown.length >= 3) break;
      if (shown.includes(e) || !pass(e)) continue;
      if (shown.some((s) => same(s, e) || overlapShare(s.idea, e.idea) >= maxOverlap)) continue;
      shown.push(e);
    }
    if (shown.length >= 3) break;
  }
  return { shown: shown.map((e) => e.idea), passed: pool.filter((e) => !e.score.cmp.reskin && e.score.overall >= 6).length };
}

// ---------- rendering ----------
function renderSteps() {
  $('#steps').innerHTML = stepsOf().map((step) => {
    const [id, label] = step, opts = optionsOf(step);
    if (!opts.length) return '';
    const cur = state.answers[id] ?? '';
    return `<div class="field"><label for="q-${id}">${esc(label)}</label><select id="q-${id}" data-q="${id}">
      <option value="">Any</option>${opts.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
  }).join('');
}

function refHtml(r) {
  const img = r.media?.path ? `<img src="${esc(r.media.path)}" alt="" loading="lazy">` : '<span class="noimg"></span>';
  return `<a class="ref" href="https://github.com/${esc(r.repo)}" target="_blank" rel="noopener" title="${esc(r.note || r.description || r.repo)}">${img}<span>${esc(r.repo)}</span></a>`;
}

function fillYours(t, e) {
  const a = valid(), aud = AUD[a.audience];
  return t.replaceAll('{title}', e.title).replaceAll('{forAud}', aud ? `, for ${aud.label.toLowerCase()}` : '')
    .replaceAll('{audOr}', aud ? aud.label.toLowerCase() : 'people').replaceAll('{artOr}', ART[a.art]?.label.toLowerCase() ?? 'visual')
    .replaceAll('{artIn}', ART[a.art] ? ` in ${ART[a.art].label.toLowerCase()}` : '').replaceAll('{character}', character());
}

function weekendOf(e) {
  const a = valid(), core = CORE[a.appkind] ?? CORE[a.genre] ?? CORE[a.for] ?? CORE[state.kind];
  const lead = signatureBlocks(e.idea)[0];
  const aud = AUD[a.audience];
  return [
    `Build the core with placeholder art: ${core}.`,
    lead ? `Add ${lead.name.toLowerCase()}, so ${sig(lead)}.` : 'Add the first piece below on top of the core.',
    `Show it to ${aud ? `one of the ${aud.label.toLowerCase()} you know` : 'one friend'} and watch what they do first.`,
  ];
}

const CORE_SIZE = 4;
function coreSplit(idea) {
  const ordered = displayOrder(idea).map((x) => x.f).filter((f) => f.role !== 'foundation');
  return { core: ordered.slice(0, CORE_SIZE), later: ordered.slice(CORE_SIZE) };
}
function displayOrder(idea) {
  const rank = new Map([...idea.features.filter((f) => f.role === 'foundation'), ...signatureBlocks(idea), ...ambientBlocks(idea)].map((f, i) => [f.id, i]));
  return idea.features.map((f, j) => ({ f, j })).sort((x, y) => (rank.get(x.f.id) ?? 99) - (rank.get(y.f.id) ?? 99));
}

function pieceRows(idea, rows) {
  return rows.map(({ f, j }) => `
        <li class="feature">
          <button class="icon-btn" type="button" data-lock="${j}" aria-pressed="${idea.locked.has(f.id)}" aria-label="Keep ${esc(f.name)}" title="Keep this piece when shuffling">${LOCK}</button>
          <div>
            <p class="fname">${esc(f.name)}</p>
            <p class="fadds">${esc(sig(f) ? cap(sig(f)) : f.ambient ? `The whole thing is ${f.ambient}` : f.adds)}.</p>
            <div class="refs">${f.repos.length ? refsFor(f).map(refHtml).join('') : `<span class="gen-note">No vetted reference in the archive yet. Scout for: ${esc(f.scout ?? f.query)}.${refsFor(f)[0] ? ' Closest match so far:' : ''}</span>${refsFor(f).slice(0, 1).map(refHtml).join('')}`}</div>
          </div>
          <button class="icon-btn" type="button" data-swap="${j}" aria-label="Swap ${esc(f.name)} for something else" title="Swap this piece">${SHUFFLE}</button>
        </li>`).join('');
}

function moneyHtml(m) {
  const rows = [['How it earns', `${m.model.label}: ${m.priceLabel}. ${m.model.how}`], ['Who pays', m.who], ['Free vs paid', m.free],
    ['How people find it', m.find], ['The maths', m.maths], ['Watch out for', m.watch]];
  return `<div class="money"><h4 class="sub-h">Money plan</h4><dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="gen-note">Rough planning numbers from typical prices in this category. Check real competitors’ prices before you commit.</p></div>`;
}

function ideaHtml(e, n) {
  const { idea, score } = e;
  const chips = Object.keys(valid()).map((k) => `<span>${esc(labelOf(k))}</span>`).join('');
  const yours = YOURS[state.kind], picks = [...new Set(idea.yours.map((i) => i % yours.length))];
  return `<article class="idea" data-i="${n}" aria-labelledby="idea-${n}">
    <div class="idea-head">
      <h3 id="idea-${n}">${esc(e.title)}</h3>
      <p class="summary">${esc(e.summary)}</p>
      <div class="scoreline">
        <span class="score-badge" aria-label="Score ${score.overall} out of 10">${score.overall.toFixed(1)}<small>/10</small></span>
        <span class="verdict">${esc(score.cmp.verdict)}</span>
        <details class="breakdown"><summary>Why this score</summary>
          <table><tbody>${Object.keys(score.money ? MONEY_WEIGHTS : WEIGHTS).map((k) => `<tr><th scope="row">${CRIT_LABEL[k]}</th><td class="num">${score.crit[k][0].toFixed(1)}</td><td>${esc(score.crit[k][1])}</td></tr>`).join('')}</tbody></table>
          <p class="gen-note">${score.money ? 'Estimated from the pieces, your answers and typical prices. Weights: willingness to pay 25%, demand, niche and reach 15% each, recurring income, buildability and clarity 10% each.' : 'Estimated from the pieces and your answers. Weights: differentiation 25%, clarity 20%, coherence and buildability 15% each, references and ownership 10% each, delight 5%.'}</p>
        </details>
      </div>
      <p class="why"><strong>Why it’s different.</strong> ${esc(e.why)}</p>
      ${score.money ? moneyHtml(score.money) : ''}
      ${chips ? `<div class="chips-row">${chips}</div>` : ''}
    </div>
    <div class="section">
      <h4 class="sub-h">How it’s built</h4>
      <ul class="features">${pieceRows(idea, displayOrder(idea).filter(({ f }) => !coreSplit(idea).later.includes(f)))}</ul>
    </div>
    ${coreSplit(idea).later.length ? `<div class="section">
      <h4 class="sub-h">Later, once the core works</h4>
      <ul class="features">${pieceRows(idea, displayOrder(idea).filter(({ f }) => coreSplit(idea).later.includes(f)))}</ul>
    </div>` : ''}
    <div class="section">
      <h4 class="sub-h">First weekend</h4>
      <ol class="steps-list">${weekendOf(e).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    </div>
    <div class="yours"><h4>Make it yours</h4><ul>${picks.map((i) => `<li>${esc(fillYours(yours[i], e))}</li>`).join('')}</ul></div>
    <div class="actions">
      <button class="btn small" type="button" data-copy>Copy as prompt</button>
      <button class="btn small ghost" type="button" data-reroll>Shuffle the rest</button>
    </div>
  </article>`;
}

let ideas = [];
let passed = 0;
function render(announce) {
  const evals = []; ideas.forEach((x, i) => evals.push(evaluate(x, i, evals.map((e) => e.title))));
  $('#ideas').innerHTML = evals.length ? evals.map(ideaHtml).join('')
    : '<p class="empty">Nothing in the archive fits every answer. Set one or two questions back to Any.</p>';
  $('#ideas').removeAttribute('aria-busy');
  if (announce) {
    $('#status').textContent = evals.length
      ? (passed ? `${evals.length} idea${evals.length > 1 ? 's' : ''}, best first.${evals.length < 3 ? ' The other drafts were too close to existing products to show.' : ''} ${passed} of 12 drafts cleared the bar (6.0 or higher, not a reskin).`
        : `No draft cleared the bar (6.0, not a reskin). ${state.count > 4 ? `${state.count} pieces is a lot for one person; try 4.` : 'Try naming an audience or an art style.'}`)
      : 'No ideas fit these answers.';
  }
}

function generate(seed = Math.floor(Math.random() * 1e9)) {
  state.seed = seed;
  const set = generateSet(seed);
  ideas = set.shown; passed = set.passed;
  render(true);
  writeHash();
}

function promptOf(idea) {
  const i = ideas.indexOf(idea), e = ideas.slice(0, i + 1).reduce((acc, x, k) => [...acc, evaluate(x, k, acc.map((a) => a.title))], []).at(-1);
  return [
    'Help me build this idea, using references from my Codex archive (https://seanjoudrie.github.io/Codex/).', '',
    `${e.title}. ${e.summary}`, '',
    `Why it's different: ${e.why}`,
    `Score: ${e.score.overall}/10 (${e.score.cmp.verdict}). Closest existing product: ${e.score.cmp.comp.name}.`, '',
    'How it’s built:',
    ...idea.features.map((f) => `- ${f.name}: ${sig(f) ?? (f.ambient ? `the whole thing is ${f.ambient}` : f.adds)}. References: ${refsFor(f).map((r) => `https://github.com/${r.repo}`).join(', ') || `none yet (scout: ${f.scout ?? f.query})`}`),
    '', 'First weekend:', ...weekendOf(e).map((x) => `- ${x}`),
    ...(e.score.money ? ['', 'Money plan (the main goal: this app pays for my free projects):', `- How it earns: ${e.score.money.model.label}, ${e.score.money.priceLabel}`, `- Who pays: ${e.score.money.who}`, `- Free vs paid: ${e.score.money.free}`, `- How people find it: ${e.score.money.find}`, `- The maths: ${e.score.money.maths}`, `- Watch out for: ${e.score.money.watch}`, 'Also check the real prices of the closest competitors, and tell me the fastest path to the first paying customer.'] : []),
    '', 'Read the reference READMEs first. Then give me the stack, how these pieces connect into one experience, the hardest part and which reference solves it, a first-weekend plan, and the licence of any code I would copy.',
  ].join('\n');
}

// ---------- share links (old links still open: unknown keys are ignored, missing ones default) ----------
function writeHash() {
  const p = new URLSearchParams({ ...(money() ? { goal: 'money' } : {}), kind: state.kind, ...valid(), n: state.count, seed: state.seed });
  if (state.twist.trim()) p.set('twist', state.twist.trim());
  history.replaceState(null, '', `#${p}`);
}
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (!p.has('kind') || !KINDS[p.get('kind')]) return false;
  state.kind = p.get('kind'); state.answers = {}; state.goal = p.get('goal') === 'money' ? 'money' : 'fun';
  for (const [id] of stepsOf()) if (p.get(id)) state.answers[id] = p.get(id);
  state.twist = p.get('twist') ?? '';
  state.count = Math.min(10, Math.max(2, +p.get('n') || 4));
  state.seed = +p.get('seed') || 1;
  return true;
}

// ---------- events ----------
function syncForm() {
  $('#goal').value = state.goal; $('#kind').value = state.kind; $('#count').value = state.count; $('#countOut').textContent = state.count; $('#twist').value = state.twist;
  renderSteps();
}
$('#goal').addEventListener('change', (e) => { state.goal = e.target.value; renderSteps(); });
$('#kind').addEventListener('change', (e) => { state.kind = e.target.value; const aud = state.answers.audience; state.answers = aud ? { audience: aud } : {}; renderSteps(); });
$('#steps').addEventListener('change', (e) => {
  const q = e.target.dataset.q; if (!q) return;
  state.answers[q] = e.target.value;
  if (q === 'area') { delete state.answers.appkind; renderSteps(); }
});
$('#twist').addEventListener('input', (e) => { state.twist = e.target.value; });
$('#count').addEventListener('input', (e) => { state.count = +e.target.value; $('#countOut').textContent = state.count; });
$('#form').addEventListener('submit', (e) => { e.preventDefault(); generate(); });

$('#surprise').addEventListener('click', () => {
  const r = rng(Math.floor(Math.random() * 1e9));
  state.kind = pick(r, money() ? ['app', 'app', 'tool', 'game', 'website'] : Object.keys(KINDS)); state.answers = {}; state.twist = '';
  for (const step of stepsOf()) { const opts = optionsOf(step); if (opts.length && r() < 0.85) state.answers[step[0]] = pick(r, opts)[0]; }
  state.count = 3 + Math.floor(r() * 3);
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
    const next = choose(idea.r, idea.features.length, others, [old.id]).find((f) => !others.includes(f));
    if (next) { idea.features[j] = next; idea.locked.delete(old.id); render(); $('#status').textContent = `Swapped ${old.name.toLowerCase()} for ${next.name.toLowerCase()}.`; }
    else $('#status').textContent = `Nothing else fits in place of ${old.name.toLowerCase()} with these answers.`;
  } else if (e.target.closest('[data-reroll]')) {
    idea.features = choose(idea.r, state.count, idea.features.filter((f) => idea.locked.has(f.id)));
    render(); $('#status').textContent = 'Shuffled the pieces you didn’t keep.';
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
generate(fromLink ? state.seed : 20260924);

// exposed for the review harness (scripts can read scores without scraping text)
const byName = new Map(features.map((f) => [f.name, f]));
window.__codexIdeas = {
  // score an arbitrary set of pieces (by name) under the current answers — used to score the old generator's output fairly
  scoreBlocks: (names) => { const e = evaluate({ features: names.map((n) => byName.get(n)).filter(Boolean), locked: new Set(), yours: [0, 0], r: rng(1) }); return { score: e.score.overall, verdict: e.score.cmp.verdict, closest: e.score.cmp.comp.name, crit: Object.fromEntries(Object.entries(e.score.crit).map(([k, v]) => [k, v[0]])) }; },
  evaluate: () => ideas.reduce((acc, x, i) => [...acc, evaluate(x, i, acc.map((e) => e.title))], []).map((e) => ({ title: e.title, summary: e.summary, why: e.why, score: e.score.overall, verdict: e.score.cmp.verdict, closest: e.score.cmp.comp.name, crit: Object.fromEntries(Object.entries(e.score.crit).map(([k, v]) => [k, v[0]])), pieces: e.idea.features.map((f) => f.name) })) };
