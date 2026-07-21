import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('PEXELS_API_KEY is not set. Run with: node --env-file=.env scripts/fetch-photos-pexels.js');
  process.exit(1);
}

const MAX_REQUESTS_PER_RUN = Number(process.env.MAX_REQUESTS_PER_RUN || 190);
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildQuery(activity) {
  return `${activity.title} ${activity.city} Japan`;
}

async function searchPhoto(activity, retries = 3) {
  const query = encodeURIComponent(buildQuery(activity));
  const url = `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`;
  const response = await fetch(url, {
    headers: { Authorization: API_KEY },
  });

  if (response.status === 429) {
    if (retries <= 0) {
      throw new Error('RATE_LIMITED');
    }
    const retryAfter = Number(response.headers.get('retry-after')) || 10;
    console.log(`429 received, waiting ${retryAfter}s before retry...`);
    await sleep(retryAfter * 1000);
    return searchPhoto(activity, retries - 1);
  }

  const remaining = Number(response.headers.get('x-ratelimit-remaining'));
  if (!response.ok) {
    throw new Error(`Pexels API error ${response.status} for "${activity.id}"`);
  }
  const body = await response.json();
  const result = body.photos && body.photos[0];
  return { result, remaining };
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const pending = activities.filter((a) => a.imageSource !== 'pexels');

  console.log(`Total activities: ${activities.length}`);
  console.log(`Already fetched via Pexels: ${activities.length - pending.length}`);
  console.log(`Pending: ${pending.length}`);

  let requestsUsed = 0;
  let matched = 0;
  const noMatch = [];

  for (const activity of pending) {
    if (requestsUsed >= MAX_REQUESTS_PER_RUN) {
      console.log(`Reached MAX_REQUESTS_PER_RUN (${MAX_REQUESTS_PER_RUN}) for this run.`);
      break;
    }

    let remaining;
    try {
      const { result, remaining: r } = await searchPhoto(activity);
      remaining = r;
      requestsUsed++;

      if (result) {
        activity.imageUrl = result.src.large;
      } else {
        activity.imageUrl = null;
        noMatch.push(activity.id);
      }
      delete activity.imageCredit;
      activity.imageSource = 'pexels';
      matched++;
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        console.log('Still rate-limited after retries. Stopping this run — resume later.');
        break;
      }
      console.error(`Error fetching photo for ${activity.id}: ${err.message}`);
      break;
    }

    if (requestsUsed % 50 === 0) {
      writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');
      console.log(`Progress saved (${requestsUsed} this run, rate limit remaining: ${remaining})`);
    }

    await sleep(DELAY_MS);
  }

  writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');

  const stillPending = activities.filter((a) => a.imageSource !== 'pexels').length;
  console.log(`\nThis run: ${requestsUsed} requests used, ${matched} photos matched.`);
  if (noMatch.length > 0) {
    console.log(`No Pexels results for: ${noMatch.join(', ')}`);
  }
  console.log(`Still pending: ${stillPending} / ${activities.length}`);
}

main();
