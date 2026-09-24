// Shared by the site (browser) and scripts/ (Node): usefulness score + idea matching.

// ---- Usefulness score (0–100) — decides order inside every category. ----
// Nothing is ever removed from the archive; weak entries just sink to the end.
export function usefulness(r, now = Date.now()) {
  let s = 0;
  const curated = r.sources?.some((x) => x === 'seed' || x === 'scout');
  if (curated) s += 20;                                            // hand-picked or scout-verified
  s += (r.wow ?? 0) * 4;                                           // scout's 1–3 "wow"
  s += { demo: 20, readme: 12, social: 3 }[r.media?.kind] ?? 0;    // something to look at
  s += Math.min(25, 5 * Math.log10((r.stars ?? 0) + 1));           // 100k★ ≈ 25
  const age = r.pushed ? (now - Date.parse(r.pushed)) / 864e5 : Infinity;
  s += age < 365 ? 8 : age < 3 * 365 ? 4 : 0;                      // still alive
  s += Math.min(9, 3 * Math.max(0, (r.sources?.length ?? 1) - 1)); // found by several sources
  if (r.technique || r.note) s += 4;
  if (r.list) s -= 30;                                             // link collections: kept, but last
  if (r.archived) s -= 8;
  return Math.max(0, Math.min(100, Math.round(s)));
}

// ---- Idea matching — "a game with a smart CPU opponent" → ranked references. ----
const STOP = new Set(('a an the and or of to for in on with without into from by at as is are be it its this that these those ' +
  'i me my we our you your want wanna make build create something thing things like some kind sort way ways how what ' +
  'which who can could should would do does using use get need app project cool really very just also more most').split(' '));

// Small synonym map so plain-language ideas hit technical words.
const SYN = {
  ai: ['ai', 'bot', 'opponent', 'cpu', 'minimax', 'mcts', 'behavior', 'behaviour', 'agent', 'utility'],
  opponent: ['opponent', 'ai', 'bot', 'minimax', 'mcts', 'engine'],
  enemy: ['enemy', 'ai', 'steering', 'pathfinding', 'behavior'],
  chess: ['chess', 'engine', 'minimax'],
  '3d': ['3d', 'three', 'webgl', 'mesh', 'voxel'],
  model: ['model', 'mesh', 'modeling', 'sculpt', 'cad'],
  animation: ['animation', 'motion', 'tween', 'spring', 'easing', 'keyframe'],
  animate: ['animation', 'motion', 'tween', 'spring'],
  shader: ['shader', 'glsl', 'webgl', 'raymarching'],
  water: ['water', 'fluid', 'ocean', 'wave'],
  fluid: ['fluid', 'navier', 'smoke', 'water'],
  physics: ['physics', 'simulation', 'rigid', 'cloth', 'collision'],
  map: ['map', 'maps', 'globe', 'geospatial', 'terrain'],
  world: ['world', 'terrain', 'procedural', 'map', 'planet'],
  generate: ['procedural', 'generation', 'generative', 'generator'],
  procedural: ['procedural', 'generation', 'generator', 'noise'],
  music: ['music', 'audio', 'synth', 'sequencer'],
  sound: ['sound', 'audio', 'synth'],
  security: ['security', 'ctf', 'reverse', 'binary', 'crypto', 'packet'],
  hack: ['security', 'reverse', 'binary', 'ctf'],
  retro: ['retro', 'emulator', 'pixel', 'crt', 'demoscene'],
  sort: ['sort', 'sorting', 'algorithm', 'visualizer'],
  maze: ['maze', 'pathfinding', 'labyrinth'],
  particles: ['particle', 'particles', 'points'],
  glass: ['glass', 'refraction', 'lens', 'blur'],
  robot: ['robot', 'robotics', 'servo', 'arm'],
  data: ['data', 'chart', 'visualization', 'dashboard'],
  chart: ['chart', 'charts', 'visualization', 'graph'],
  multiplayer: ['multiplayer', 'netcode', 'p2p', 'webrtc', 'realtime'],
  terminal: ['terminal', 'tui', 'cli', 'console'],
};

const stem = (w) => w.replace(/(ing|ers|er|es|s)$/,'').replace(/(.)\1$/, '$1');

export function ideaTerms(text) {
  const words = text.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [];
  const terms = new Map(); // term -> weight
  for (const w of words) {
    if (STOP.has(w) || w.length < 2) continue;
    terms.set(stem(w), Math.max(terms.get(stem(w)) ?? 0, 1));
    for (const s of SYN[w] ?? SYN[stem(w)] ?? []) if (!terms.has(stem(s))) terms.set(stem(s), 0.5);
  }
  return terms;
}

// Where a word appears matters: the repo name and technique line beat a README-ish description.
function fields(r, catLabels) {
  return [
    [3, r.repo.split('/')[1]],
    [3, r.technique], [2.5, r.idea], [2, r.note],
    [2, (r.topics ?? []).join(' ')], [2, r.categories.map((c) => `${c} ${catLabels?.[c] ?? ''}`).join(' ')],
    [1.5, r.description], [1, r.language],
  ];
}

// Relevance of one repo to a set of idea terms. 0 = no match.
export function relevance(r, terms, catLabels) {
  if (!terms.size) return 0;
  let hit = 0, total = 0;
  const f = fields(r, catLabels).map(([w, t]) => [w, (t ?? '').toLowerCase().match(/[a-z0-9+#.]+/g)?.map(stem) ?? []]);
  for (const [term, tw] of terms) {
    total += tw;
    let best = 0;
    for (const [w, toks] of f) if (toks.some((t) => t === term || (term.length > 3 && t.startsWith(term)))) best = Math.max(best, w);
    hit += best * tw;
  }
  return hit / total; // average field weight per term, 0–3
}

// Rank repos for an idea: relevance first, usefulness breaks ties and lifts the good ones.
export function matchIdea(repos, text, catLabels, limit = Infinity) {
  const terms = ideaTerms(text);
  return repos
    .map((r) => ({ r, rel: relevance(r, terms, catLabels) }))
    .filter((x) => x.rel > 0.35)
    .sort((a, b) => (b.rel * 30 + (b.r.score ?? 0) * 0.4) - (a.rel * 30 + (a.r.score ?? 0) * 0.4))
    .slice(0, limit);
}
