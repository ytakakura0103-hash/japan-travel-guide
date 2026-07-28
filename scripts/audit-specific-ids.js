import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');

const API_KEY = process.env.PEXELS_API_KEY;
const idsFile = process.argv[2];
const outFile = process.argv[3];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function photoIdFromUrl(url) {
  const match = url && url.match(/\/photos\/(\d+)\//);
  return match ? match[1] : null;
}
async function fetchAlt(pid, retries = 3) {
  const res = await fetch(`https://api.pexels.com/v1/photos/${pid}`, { headers: { Authorization: API_KEY } });
  if (res.status === 429) {
    if (retries <= 0) throw new Error('RATE_LIMITED');
    await sleep(10000);
    return fetchAlt(pid, retries - 1);
  }
  const body = await res.json();
  return body.alt || '';
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const byId = new Map(activities.map((a) => [a.id, a]));
  const ids = JSON.parse(readFileSync(idsFile, 'utf-8'));

  const results = [];
  for (const id of ids) {
    const a = byId.get(id);
    if (!a) continue;
    const pid = photoIdFromUrl(a.imageUrl);
    const alt = await fetchAlt(pid);
    results.push({ id: a.id, title: a.title, city: a.city, alt });
    await sleep(250);
  }
  writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log('done:', results.length);
}
main();
