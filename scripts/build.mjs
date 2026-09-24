// Step 5 — assemble the static site into dist/ for GitHub Pages.
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(new URL('data/', dist), { recursive: true });
await cp(new URL('site/', root), dist, { recursive: true });
for (const f of ['index.json', 'categories.json', 'features.json', 'comps.json', 'money.json']) await cp(new URL(`data/${f}`, root), new URL(`data/${f}`, dist));
if (existsSync(new URL('media/', root))) await cp(new URL('media/', root), new URL('media/', dist), { recursive: true });
console.log('build: dist/ ready');
