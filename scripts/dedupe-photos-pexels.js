import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('PEXELS_API_KEY is not set. Run with: node --env-file=.env scripts/dedupe-photos-pexels.js');
  process.exit(1);
}

const MAX_REQUESTS_PER_RUN = Number(process.env.MAX_REQUESTS_PER_RUN || 190);
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function photoIdFromUrl(url) {
  const match = url && url.match(/\/photos\/(\d+)\//);
  return match ? match[1] : null;
}

function buildQueryVariants(activity) {
  const interest = activity.interests && activity.interests[0];
  return [
    `${activity.title} ${activity.city} Japan`,
    `${activity.title}`,
    `${activity.title} Japan`,
    interest ? `${activity.city} ${interest.replace(/-/g, ' ')} Japan` : `${activity.city} Japan`,
  ];
}

async function searchCandidates(query, retries = 3) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
  const response = await fetch(url, { headers: { Authorization: API_KEY } });

  if (response.status === 429) {
    if (retries <= 0) throw new Error('RATE_LIMITED');
    const retryAfter = Number(response.headers.get('retry-after')) || 10;
    console.log(`429 received, waiting ${retryAfter}s before retry...`);
    await sleep(retryAfter * 1000);
    return searchCandidates(query, retries - 1);
  }

  if (!response.ok) throw new Error(`Pexels API error ${response.status} for query "${query}"`);

  const remaining = Number(response.headers.get('x-ratelimit-remaining'));
  const body = await response.json();
  return { photos: body.photos || [], remaining };
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));

  // Group entries by their current image's Pexels photo id.
  const byPhotoId = new Map();
  for (const a of activities) {
    const pid = photoIdFromUrl(a.imageUrl);
    if (!pid) continue;
    if (!byPhotoId.has(pid)) byPhotoId.set(pid, []);
    byPhotoId.get(pid).push(a);
  }

  const usedPhotoIds = new Set(byPhotoId.keys());
  // Within each duplicate group, keep the first entry (alphabetical by id) as-is;
  // the rest need a fresh, not-yet-used photo.
  const needsReplacement = [];
  for (const [, group] of byPhotoId) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    for (const a of sorted.slice(1)) needsReplacement.push(a);
  }

  // Resume support: skip entries already marked resolved in a prior run.
  const stillDuplicated = needsReplacement.filter((a) => a.dedupeResolved !== true);

  console.log(`Total activities: ${activities.length}`);
  console.log(`Entries needing a replacement photo: ${needsReplacement.length}`);
  console.log(`Already resolved in a prior run: ${needsReplacement.length - stillDuplicated.length}`);
  console.log(`Remaining to process: ${stillDuplicated.length}`);

  let requestsUsed = 0;
  let resolved = 0;
  const unresolved = [];

  for (const activity of stillDuplicated) {
    if (requestsUsed >= MAX_REQUESTS_PER_RUN) {
      console.log(`Reached MAX_REQUESTS_PER_RUN (${MAX_REQUESTS_PER_RUN}) for this run.`);
      break;
    }

    let found = null;
    let remaining;
    try {
      for (const query of buildQueryVariants(activity)) {
        if (requestsUsed >= MAX_REQUESTS_PER_RUN) break;
        const { photos, remaining: r } = await searchCandidates(query);
        remaining = r;
        requestsUsed++;
        await sleep(DELAY_MS);

        const fresh = photos.find((p) => !usedPhotoIds.has(String(p.id)));
        if (fresh) {
          found = fresh;
          break;
        }
      }
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        console.log('Still rate-limited after retries. Stopping this run — resume later.');
        break;
      }
      console.error(`Error resolving photo for ${activity.id}: ${err.message}`);
      break;
    }

    if (found) {
      activity.imageUrl = found.src.large;
      activity.dedupeResolved = true;
      usedPhotoIds.add(String(found.id));
      resolved++;
    } else {
      activity.dedupeResolved = false;
      unresolved.push(activity.id);
    }

    if (requestsUsed % 40 < 4) {
      writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');
      console.log(`Progress saved (${requestsUsed} requests this run, rate limit remaining: ${remaining})`);
    }
  }

  writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');

  const stillUnresolved = activities.filter((a) => a.dedupeResolved === false).length;
  console.log(`\nThis run: ${requestsUsed} requests used, ${resolved} entries resolved with a fresh photo.`);
  if (unresolved.length > 0) {
    console.log(`Could not find a fresh photo for: ${unresolved.join(', ')}`);
  }
  console.log(`Still unresolved across all runs: ${stillUnresolved}`);
}

main();
