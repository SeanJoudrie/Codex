// Shared helpers: JSON files and a rate-limit-aware GitHub API client.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export const DATA = new URL('../data/', import.meta.url);
export const MEDIA = new URL('../media/', import.meta.url);

export async function readJSON(name, fallback) {
  const url = new URL(name, DATA);
  if (!existsSync(url)) return fallback;
  return JSON.parse(await readFile(url, 'utf8'));
}

export async function writeJSON(name, value) {
  await writeFile(new URL(name, DATA), JSON.stringify(value, null, 1) + '\n');
}

const TOKEN = process.env.GITHUB_TOKEN;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET a GitHub API path. Waits out rate limits instead of failing the run.
export async function gh(path, { accept = 'application/vnd.github+json', raw = false } = {}) {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: {
          Accept: accept,
          'User-Agent': 'codex',
          ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      // Dropped sockets and timeouts happen on long runs — back off and retry.
      console.warn(`network error on ${path} (${e.cause?.code ?? e.name}), retrying`);
      await sleep(2_000 * 2 ** attempt);
      continue;
    }
    if (res.status === 404) return null;
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
      const wait = Math.min(Math.max(reset - Date.now(), 5_000), 120_000);
      console.warn(`rate limited on ${path}, waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return raw ? res.text() : res.json();
  }
  throw new Error(`gave up on ${url}`);
}

// "owner/repo" from any github.com URL, or null.
export function repoFromUrl(href) {
  const m = /github\.com\/([\w.-]+)\/([\w.-]+)/i.exec(href);
  if (!m) return null;
  const repo = m[2].replace(/\.git$/, '');
  if (['topics', 'orgs', 'sponsors', 'apps', 'features', 'marketplace'].includes(m[1])) return null;
  return `${m[1]}/${repo}`;
}

export const today = () => new Date().toISOString().slice(0, 10);
