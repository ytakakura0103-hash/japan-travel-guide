import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('UNSPLASH_ACCESS_KEY is not set. Run with: node --env-file=.env scripts/fetch-photos.js');
  process.exit(1);
}

const MAX_REQUESTS_PER_RUN = Number(process.env.MAX_REQUESTS_PER_RUN || 45);
const SAFETY_MARGIN = 3;

function buildQuery(activity) {
  return `${activity.title} ${activity.city} Japan`;
}

function withUtm(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=curious-city&utm_medium=referral`;
}

async function searchPhoto(activity) {
  const query = encodeURIComponent(buildQuery(activity));
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;
  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });
  const remaining = Number(response.headers.get('x-ratelimit-remaining'));
  if (!response.ok) {
    throw new Error(`Unsplash API error ${response.status} for "${activity.id}"`);
  }
  const body = await response.json();
  const result = body.results && body.results[0];
  return { result, remaining };
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const pending = activities.filter((activity) => !activity.imageUrl);

  console.log(`Total activities: ${activities.length}`);
  console.log(`Already have photos: ${activities.length - pending.length}`);
  console.log(`Pending: ${pending.length}`);

  let requestsUsed = 0;
  let matched = 0;
  let noMatch = [];

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
        activity.imageUrl = result.urls.regular;
        activity.imageCredit = {
          photographerName: result.user.name,
          photographerUrl: withUtm(result.user.links.html),
          unsplashUrl: withUtm(result.links.html),
        };
        matched++;
      } else {
        noMatch.push(activity.id);
      }
    } catch (err) {
      console.error(`Error fetching photo for ${activity.id}: ${err.message}`);
      break;
    }

    if (requestsUsed % 10 === 0) {
      writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');
      console.log(`Progress saved (${requestsUsed} requests used, rate limit remaining: ${remaining})`);
    }

    if (Number.isFinite(remaining) && remaining <= SAFETY_MARGIN) {
      console.log(`Rate limit nearly exhausted (remaining: ${remaining}). Stopping this run.`);
      break;
    }
  }

  writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');

  const stillPending = activities.filter((activity) => !activity.imageUrl).length;
  console.log(`\nThis run: ${requestsUsed} requests used, ${matched} photos matched.`);
  if (noMatch.length > 0) {
    console.log(`No Unsplash results for: ${noMatch.join(', ')}`);
  }
  console.log(`Still pending: ${stillPending} / ${activities.length}`);
}

main();
