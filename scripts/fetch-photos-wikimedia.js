import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');

const MAX_REQUESTS_PER_RUN = Number(process.env.MAX_REQUESTS_PER_RUN || 400);
const DELAY_MS = 150;
const MIN_WIDTH = 800;
const THUMB_WIDTH = 940;
const USER_AGENT = 'CuriousCityPhotoBot/1.0 (travel guide site; contact: curiouscity0103@gmail.com)';

// Only permissive, attribution-compatible licenses. No NC/ND, no unclear/fair-use.
// Deliberately excludes "public domain" / "cc0" as a proxy filter: those licenses are
// extremely common on centuries-old ukiyo-e prints and historical paintings (the
// original creator's copyright has expired), which pollute results for temple/shrine
// searches. Requiring a modern CC BY / CC BY-SA license keeps results to actual
// contemporary photographs uploaded by their photographer.
const LICENSE_ALLOWLIST = [
  'cc by 2.0',
  'cc by 2.5',
  'cc by 3.0',
  'cc by 4.0',
  'cc by-sa 2.0',
  'cc by-sa 2.5',
  'cc by-sa 3.0',
  'cc by-sa 4.0',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function photoIdFromPexelsUrl(url) {
  const match = url && url.match(/\/photos\/(\d+)\//);
  return match ? match[1] : null;
}

function stripHtml(value) {
  return (value || '').replace(/<[^>]+>/g, '').trim();
}

function buildQueries(activity) {
  return [
    `${activity.title} ${activity.city} Japan`,
    `${activity.title}`,
    `${activity.title.replace(/\(.*\)/, '').trim()} Japan`,
  ];
}

async function searchCommons(query, retries = 3) {
  const url =
    'https://commons.wikimedia.org/w/api.php' +
    '?action=query&generator=search&gsrsearch=' +
    encodeURIComponent(query) +
    '&gsrnamespace=6&gsrlimit=10&prop=imageinfo' +
    `&iiprop=url|extmetadata|size&iiurlwidth=${THUMB_WIDTH}&format=json&origin=*`;

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (res.status === 429 || res.status === 503) {
    if (retries <= 0) throw new Error('RATE_LIMITED');
    await sleep(5000);
    return searchCommons(query, retries - 1);
  }
  if (!res.ok) throw new Error(`Commons API error ${res.status} for query "${query}"`);
  const body = await res.json();
  const pages = body.query ? Object.values(body.query.pages) : [];
  return pages
    .map((p) => ({ title: p.title, info: p.imageinfo && p.imageinfo[0] }))
    .filter((p) => p.info);
}

function pickBestCandidate(candidates, usedFileUrls) {
  for (const { title, info } of candidates) {
    if (usedFileUrls.has(info.url) || usedFileUrls.has(info.descriptionurl)) continue;
    if (info.width < MIN_WIDTH) continue;
    // Skip non-photo files (svg icons, maps, logos) heuristically.
    if (/\.(svg|pdf|ogv|webm|gif|png)$/i.test(title)) continue;
    if (/\b(logo|map|icon|diagram|coat of arms|journal|figure|chart|graph|screenshot)\b/i.test(title)) continue;

    const meta = info.extmetadata || {};
    const licenseShort = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value).toLowerCase();
    if (!LICENSE_ALLOWLIST.includes(licenseShort)) continue;

    const artist = stripHtml(meta.Artist && meta.Artist.value) || null;
    const licenseName = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value) || null;

    return {
      imageUrl: info.thumburl || info.url,
      fileUrl: info.descriptionurl,
      author: artist,
      licenseName,
    };
  }
  return null;
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));

  const targetIdsPath = process.argv[2];
  let pending = activities;
  if (targetIdsPath) {
    const targetIds = new Set(JSON.parse(readFileSync(targetIdsPath, 'utf-8')));
    pending = activities.filter((a) => targetIds.has(a.id));
  }
  pending = pending.filter((a) => a.wikimediaChecked !== true);

  const usedFileUrls = new Set(
    activities.filter((a) => a.imageSource === 'wikimedia' && a.imageCredit).map((a) => a.imageCredit.fileUrl)
  );

  console.log(`Candidates this invocation: ${pending.length}`);

  let used = 0;
  let matched = 0;
  let noMatch = 0;

  for (const activity of pending) {
    if (used >= MAX_REQUESTS_PER_RUN) break;

    let found = null;
    try {
      for (const query of buildQueries(activity)) {
        if (used >= MAX_REQUESTS_PER_RUN) break;
        const candidates = await searchCommons(query);
        used++;
        await sleep(DELAY_MS);
        found = pickBestCandidate(candidates, usedFileUrls);
        if (found) break;
      }
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        console.log('Rate-limited by Commons, stopping run.');
        break;
      }
      console.error(`Error for ${activity.id}: ${err.message}`);
    }

    activity.wikimediaChecked = true;
    if (found) {
      activity.imageUrl = found.imageUrl;
      activity.imageSource = 'wikimedia';
      activity.imageCredit = { author: found.author, licenseName: found.licenseName, fileUrl: found.fileUrl };
      usedFileUrls.add(found.fileUrl);
      matched++;
      console.log(`MATCHED ${activity.id}: ${found.fileUrl}`);
    } else {
      noMatch++;
    }

    if ((matched + noMatch) % 25 === 0) {
      writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');
      console.log(`Progress saved (${matched + noMatch} processed this run)`);
    }
  }

  writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');

  const stillPending = activities.filter((a) => a.wikimediaChecked !== true).length;
  console.log(`\nThis run: ${used} requests, ${matched} matched, ${noMatch} no-match (kept existing photo).`);
  console.log(`Still unchecked across all runs: ${stillPending}`);
}

main();
