import { mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderSpotPageHtml, buildSpotPath } from '../site/src/spot-page.js';
import { buildSitemapXml } from '../site/src/sitemap.js';

const SITE_URL = 'https://REPLACE_WITH_YOUR_DOMAIN';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.join(__dirname, '..', 'site');
const dataPath = path.join(siteDir, 'data', 'activities.json');
const spotsDir = path.join(siteDir, 'spots');

const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));

mkdirSync(spotsDir, { recursive: true });

for (const existingFile of readdirSync(spotsDir)) {
  if (existingFile.endsWith('.html')) {
    unlinkSync(path.join(spotsDir, existingFile));
  }
}

for (const activity of activities) {
  const html = renderSpotPageHtml(activity, { siteUrl: SITE_URL });
  writeFileSync(path.join(spotsDir, `${activity.id}.html`), html, 'utf-8');
}

writeFileSync(path.join(siteDir, 'sitemap.xml'), buildSitemapXml(activities, SITE_URL), 'utf-8');

console.log(`Generated ${activities.length} spot pages in site/spots/ and site/sitemap.xml (${activities.length + 1} URLs).`);

const ids = activities.map((activity) => activity.id);
const uniqueIds = new Set(ids);
if (uniqueIds.size !== ids.length) {
  console.warn(`Warning: ${ids.length - uniqueIds.size} duplicate activity id(s) found — some spot pages were overwritten.`);
}

const pathSegmentPattern = /^[a-z0-9-]+$/;
const invalidIds = ids.filter((id) => !pathSegmentPattern.test(id));
if (invalidIds.length > 0) {
  console.warn(`Warning: ${invalidIds.length} activity id(s) contain characters outside [a-z0-9-]: ${invalidIds.join(', ')}`);
}
