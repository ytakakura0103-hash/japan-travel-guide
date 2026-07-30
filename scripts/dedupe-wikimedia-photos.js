import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'site', 'data', 'activities.json');
const USER_AGENT = 'CuriousCityPhotoBot/1.0 (travel guide site; contact: curiouscity0103@gmail.com)';
const THUMB_WIDTH = 940;
const MIN_WIDTH = 800;

const LICENSE_ALLOWLIST = [
  'cc by 2.0', 'cc by 2.5', 'cc by 3.0', 'cc by 4.0',
  'cc by-sa 2.0', 'cc by-sa 2.5', 'cc by-sa 3.0', 'cc by-sa 4.0',
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function stripHtml(v) { return (v || '').replace(/<[^>]+>/g, '').trim(); }

async function searchCommons(query, retries = 3) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
    encodeURIComponent(query) +
    `&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=${THUMB_WIDTH}&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (res.status === 429 || res.status === 503) {
    if (retries <= 0) throw new Error('RATE_LIMITED');
    await sleep(5000);
    return searchCommons(query, retries - 1);
  }
  const body = await res.json();
  const pages = body.query ? Object.values(body.query.pages) : [];
  return pages.map((p) => ({ title: p.title, info: p.imageinfo && p.imageinfo[0] })).filter((p) => p.info);
}

function pickBestCandidate(candidates, usedFileUrls) {
  for (const { title, info } of candidates) {
    if (usedFileUrls.has(info.url) || usedFileUrls.has(info.descriptionurl)) continue;
    if (info.width < MIN_WIDTH) continue;
    if (/\.(svg|pdf|ogv|webm|gif|png)$/i.test(title)) continue;
    if (/\b(logo|map|icon|diagram|coat of arms|journal|figure|chart|graph|screenshot)\b/i.test(title)) continue;
    const meta = info.extmetadata || {};
    const licenseShort = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value).toLowerCase();
    if (!LICENSE_ALLOWLIST.includes(licenseShort)) continue;
    return {
      imageUrl: info.thumburl || info.url,
      fileUrl: info.descriptionurl,
      author: stripHtml(meta.Artist && meta.Artist.value) || null,
      licenseName: stripHtml(meta.LicenseShortName && meta.LicenseShortName.value) || null,
    };
  }
  return null;
}

async function main() {
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const byId = new Map(activities.map((a) => [a.id, a]));

  const byUrl = new Map();
  for (const a of activities) {
    const url = a.imageUrl.split('?')[0];
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push(a.id);
  }
  const dupeGroups = [...byUrl.entries()].filter(([, ids]) => ids.length > 1);
  const toResolve = [];
  for (const [, ids] of dupeGroups) {
    const sorted = [...ids].sort();
    for (const id of sorted.slice(1)) toResolve.push(id);
  }

  const usedFileUrls = new Set(
    activities.filter((a) => a.imageCredit && a.imageCredit.fileUrl).map((a) => a.imageCredit.fileUrl)
  );
  const usedImageUrls = new Set(activities.map((a) => a.imageUrl));

  console.log(`Duplicate groups: ${dupeGroups.length}, entries to resolve: ${toResolve.length}`);

  for (const id of toResolve) {
    const activity = byId.get(id);
    const queries = [`${activity.title} ${activity.city} Japan`, `${activity.title}`];
    let found = null;
    try {
      for (const q of queries) {
        const candidates = await searchCommons(q);
        await sleep(200);
        found = pickBestCandidate(candidates, usedFileUrls);
        if (found && !usedImageUrls.has(found.imageUrl)) break;
        found = null;
      }
    } catch (err) {
      console.error(`Error for ${id}: ${err.message}`);
    }

    if (found) {
      activity.imageUrl = found.imageUrl;
      activity.imageSource = 'wikimedia';
      activity.imageCredit = { author: found.author, licenseName: found.licenseName, fileUrl: found.fileUrl };
      usedFileUrls.add(found.fileUrl);
      usedImageUrls.add(found.imageUrl);
      console.log(`RESOLVED ${id}: ${found.fileUrl}`);
    } else {
      console.log(`COULD NOT RESOLVE ${id} via Wikimedia — needs manual attention`);
    }
  }

  writeFileSync(dataPath, JSON.stringify(activities, null, 2) + '\n', 'utf-8');
  console.log('done');
}

main();
