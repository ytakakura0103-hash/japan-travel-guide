import { buildSpotPath } from './spot-page.js';

export function buildSitemapXml(activities, siteUrl) {
  const urlEntries = [
    `  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...activities.map(
      (activity) =>
        `  <url>\n    <loc>${siteUrl}/${buildSpotPath(activity.id)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries.join('\n')}\n</urlset>\n`;
}
