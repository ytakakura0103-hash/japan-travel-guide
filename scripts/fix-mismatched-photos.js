import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('PEXELS_API_KEY is not set. Run with: node --env-file=.env scripts/fix-mismatched-photos.js <suspects.json>');
  process.exit(1);
}

const suspectsFile = process.argv[2];
if (!suspectsFile) {
  console.error('Usage: node --env-file=.env scripts/fix-mismatched-photos.js <suspects.json>');
  process.exit(1);
}

const MAX_REQUESTS_PER_RUN = Number(process.env.MAX_REQUESTS_PER_RUN || 170);
const DELAY_MS = 300;

const JAPAN_CITY_NAMES = [
  'Tokyo', 'Osaka', 'Kyoto', 'Sendai', 'Nagoya', 'Sapporo', 'Fukuoka',
  'Yokohama', 'Kobe', 'Hiroshima', 'Hokkaido', 'Hakata', 'Naha', 'Nara',
  'Kanazawa', 'Shinjuku', 'Shibuya', 'Asakusa', 'Ginza', 'Takatsuki',
  'Hachioji', 'Ikeda', 'Kamakura', 'Nagano', 'Aomori', 'Gamag',
  'Toyohashi', 'Koya', 'Gokoku', 'Inuyama', 'Hofu', 'Hōfu', 'Yamaguchi',
  'Takayama', 'Tofukuji', 'Tofuku-ji', 'Kinkaku',
];

// Named landmarks/places that, if mentioned in a photo's alt text, indicate the
// photo is of a different well-known spot entirely (regardless of city match).
const LANDMARK_BLACKLIST = [
  'kiyomizu', 'itsukushima', 'fushimi inari', 'sun yat-sen', 'nanjing', 'kencho-ji',
  'nebuta', 'meiji jingu', 'meiji shrine', 'sensoji', 'senso-ji', 'zojoji',
  'bangkok', 'thailand', 'argentina', 'china', 'korea', 'taiwan', 'vietnam',
  'yasaka', 'heian shrine', 'myōan-ji', 'myoan-ji',
];

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
    `${activity.city} ${interest ? interest.replace(/-/g, ' ') : ''} Japan`.trim(),
    `${activity.title}`,
  ];
}

function isGoodCandidate(photo, activity, usedIds) {
  if (usedIds.has(String(photo.id))) return false;
  const alt = (photo.alt || '').toLowerCase();
  const cityLower = activity.city.toLowerCase();
  const otherCityMentioned = JAPAN_CITY_NAMES.some((c) => {
    const cLower = c.toLowerCase();
    if (cLower === cityLower) return false;
    if (activity.city === 'Hokkaido' && ['sapporo', 'hakata'].includes(cLower)) return false;
    return alt.includes(cLower);
  });
  if (otherCityMentioned) return false;
  const hitsBlacklist = LANDMARK_BLACKLIST.some((b) => alt.includes(b));
  return !hitsBlacklist;
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
  const body = await response.json();
  return body.photos || [];
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const byId = new Map(activities.map((a) => [a.id, a]));
  const suspects = JSON.parse(readFileSync(suspectsFile, 'utf-8'));

  const usedIds = new Set(
    activities.map((a) => photoIdFromUrl(a.imageUrl)).filter(Boolean)
  );

  const toFix = suspects.filter((s) => s.replaced !== true && s.unresolved !== true);
  console.log(`Total suspects: ${suspects.length}`);
  console.log(`Remaining to process: ${toFix.length}`);

  let requestsUsed = 0;
  let fixed = 0;
  const unresolved = [];

  for (const suspect of toFix) {
    if (requestsUsed >= MAX_REQUESTS_PER_RUN) break;
    const activity = byId.get(suspect.id);
    if (!activity) continue;

    let found = null;
    try {
      for (const query of buildQueryVariants(activity)) {
        if (requestsUsed >= MAX_REQUESTS_PER_RUN) break;
        const photos = await searchCandidates(query);
        requestsUsed++;
        await sleep(DELAY_MS);
        const candidate = photos.find((p) => isGoodCandidate(p, activity, usedIds));
        if (candidate) {
          found = candidate;
          break;
        }
      }
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        console.log('Rate-limited, stopping run.');
        break;
      }
      console.error(`Error for ${suspect.id}: ${err.message}`);
    }

    if (found) {
      activity.imageUrl = found.src.large;
      usedIds.add(String(found.id));
      suspect.replaced = true;
      suspect.newAlt = found.alt;
      fixed++;
      console.log(`FIXED ${suspect.id}: new alt = "${found.alt}"`);
    } else {
      suspect.unresolved = true;
      unresolved.push(suspect.id);
      console.log(`UNRESOLVED ${suspect.id}: no clean candidate found`);
    }
  }

  writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');
  writeFileSync(suspectsFile, JSON.stringify(suspects, null, 2), 'utf-8');

  console.log(`\nThis run: ${requestsUsed} requests, ${fixed} fixed, ${unresolved.length} unresolved (this run).`);
  const stillPending = suspects.filter((s) => s.replaced !== true && s.unresolved !== true).length;
  console.log(`Still pending across all runs: ${stillPending}`);
}

main();
