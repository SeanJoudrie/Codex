// Idea helper: `npm run ideas -- "a racing game with a smart CPU driver"`
// Prints the best references in the archive for an idea, grouped by category.
import { readJSON } from './lib.mjs';
import { matchIdea } from '../site/match.js';

const idea = process.argv.slice(2).join(' ').trim();
if (!idea) { console.error('usage: npm run ideas -- "describe your idea"'); process.exit(1); }

const index = await readJSON('index.json');
const cats = Object.fromEntries((await readJSON('categories.json')).map((c) => [c.id, c.label]));
const hits = matchIdea(index.repos, idea, cats, 40);
if (!hits.length) { console.log('No references in the archive yet — run the scout prompt on this idea.'); process.exit(0); }

const groups = {};
for (const { r, rel } of hits) (groups[r.categories[0]] ??= []).push({ r, rel });
console.log(`\nReferences for: "${idea}"\n`);
for (const [c, list] of Object.entries(groups)) {
  console.log(`## ${cats[c] ?? c}`);
  for (const { r, rel } of list.slice(0, 6)) {
    const line = r.technique || r.note || r.description || '';
    console.log(`- ${r.repo}  (score ${r.score ?? '?'}, ★${r.stars ?? '?'}, match ${rel.toFixed(1)})${r.homepage ? `  demo: ${r.homepage}` : ''}`);
    if (line) console.log(`    ${line}`);
  }
  console.log('');
}
