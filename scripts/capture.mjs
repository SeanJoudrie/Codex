// Step 3 — one thumbnail per repo. Fallback chain:
//   live demo screenshot → first README image/GIF → GitHub social card → (site shows a placeholder)
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { readJSON, writeJSON, MEDIA } from './lib.mjs';

const WIDTH = 600;
const index = await readJSON('index.json');
const todo = index.repos.filter((r) => !r.media);
await mkdir(MEDIA, { recursive: true });

// SwiftShader = CPU WebGL, so shader demos don't render black on GPU-less CI runners.
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const fileFor = (repo) => repo.replace('/', '__') + '.webp';

async function save(buffer, repo, animated = false) {
  const file = fileFor(repo);
  await sharp(buffer, { animated }).resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 72 }).toFile(new URL(file, MEDIA).pathname);
  return `media/${file}`;
}

async function demoShot(url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20_000 });
    await page.waitForTimeout(4_000); // let sims and shaders run a few frames
    const png = await page.screenshot();
    // Reject blank captures (a failed WebGL context is usually one flat colour).
    const { channels } = await sharp(png).stats();
    if (channels.every((c) => c.stdev < 4)) return null;
    return png;
  } catch { return null; } finally { await page.close(); }
}

async function download(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok || !/^image\//.test(res.headers.get('content-type') ?? '')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

for (const r of todo) {
  let kind = null, buf = null;
  if (r.homepage && (buf = await demoShot(r.homepage))) kind = 'demo';
  else if (r.readme_image && (buf = await download(r.readme_image))) kind = 'readme';
  else if ((buf = await download(`https://opengraph.githubassets.com/1/${r.repo}`))) kind = 'social';
  if (!buf) continue;
  try {
    r.media = { path: await save(buf, r.repo, kind === 'readme'), kind };
    console.log(`capture: ${r.repo} ← ${kind}`);
  } catch (e) { console.warn(`capture failed: ${r.repo} (${e.message})`); }
}

await browser.close();
await writeJSON('index.json', index);
