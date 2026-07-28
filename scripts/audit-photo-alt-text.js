import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');
const outPath = path.join(__dirname, '..', '..', '..', 'AppData', 'Local', 'Temp', 'claude');

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('PEXELS_API_KEY is not set. Run with: node --env-file=.env scripts/audit-photo-alt-text.js <outfile> [<category filter>]');
  process.exit(1);
}

const outFile = process.argv[2];
const categoryFilter = process.argv[3] ? process.argv[3].split(',') : null;

if (!outFile) {
  console.error('Usage: node --env-file=.env scripts/audit-photo-alt-text.js <outfile.json> [categories]');
  process.exit(1);
}

const MAX_REQUESTS_PER_RUN = Number(process.env.MAX_REQUESTS_PER_RUN || 180);
const DELAY_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function photoIdFromUrl(url) {
  const match = url && url.match(/\/photos\/(\d+)\//);
  return match ? match[1] : null;
}

async function fetchAlt(pid, retries = 3) {
  const res = await fetch(`https://api.pexels.com/v1/photos/${pid}`, {
    headers: { Authorization: API_KEY },
  });
  if (res.status === 429) {
    if (retries <= 0) throw new Error('RATE_LIMITED');
    await sleep(10000);
    return fetchAlt(pid, retries - 1);
  }
  if (!res.ok) throw new Error(`Pexels API error ${res.status} for photo ${pid}`);
  const body = await res.json();
  return body.alt || '';
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  let pending = activities;
  if (categoryFilter) {
    pending = pending.filter((a) => a.interests.some((i) => categoryFilter.includes(i)));
  }

  let existing = [];
  try {
    existing = JSON.parse(readFileSync(outFile, 'utf-8'));
  } catch {}
  const doneIds = new Set(existing.map((e) => e.id));
  pending = pending.filter((a) => !doneIds.has(a.id));

  console.log(`Total candidates: ${categoryFilter ? pending.length + doneIds.size : activities.length}`);
  console.log(`Already audited: ${doneIds.size}`);
  console.log(`Remaining this run: ${Math.min(pending.length, MAX_REQUESTS_PER_RUN)}`);

  const results = existing;
  let used = 0;

  for (const a of pending) {
    if (used >= MAX_REQUESTS_PER_RUN) break;
    const pid = photoIdFromUrl(a.imageUrl);
    if (!pid) continue;
    try {
      const alt = await fetchAlt(pid);
      results.push({ id: a.id, title: a.title, city: a.city, interests: a.interests, alt });
      used++;
    } catch (err) {
      console.error(`Error for ${a.id}: ${err.message}`);
      if (err.message === 'RATE_LIMITED') break;
    }
    if (used % 40 === 0) {
      writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`Progress saved (${used} this run)`);
    }
    await sleep(DELAY_MS);
  }

  writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nThis run: ${used} audited. Total in file: ${results.length}.`);
}

main();
