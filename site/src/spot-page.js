import { escapeHtml, buildGoogleMapsUrl, renderTagsHtml, renderPhotoHtml } from './activities-ui.js';

export function buildSpotPath(id) {
  return `spots/${id}.html`;
}

function renderDescriptionHtml(activity) {
  const text = activity.description || activity.summary;
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join('');
}

export function renderSpotPageHtml(activity, { siteUrl = 'https://ytakakura0103-hash.github.io/japan-travel-guide' } = {}) {
  const canonicalUrl = `${siteUrl}/${buildSpotPath(activity.id)}`;
  const officialLinkHtml = activity.officialUrl
    ? `<a class="official-link" href="${escapeHtml(activity.officialUrl)}" target="_blank" rel="noopener">Official site</a>`
    : '';
  const mapsLinkHtml = `<a class="maps-link" href="${escapeHtml(buildGoogleMapsUrl(activity))}" target="_blank" rel="noopener">Open in Google Maps</a>`;
  const localPickBadge = activity.isLocalPick ? '<span class="local-pick-badge">Local Pick</span>' : '';
  const ogImageTag = activity.imageUrl
    ? `\n  <meta property="og:image" content="${escapeHtml(activity.imageUrl)}" />`
    : '';
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: activity.title,
    description: activity.summary,
    address: activity.address,
    url: canonicalUrl,
  }).replace(/</g, '\\u003C');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(activity.title)} — ${escapeHtml(activity.city)} | Curious City</title>
  <meta name="description" content="${escapeHtml(activity.summary)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Curious City" />
  <meta property="og:title" content="${escapeHtml(activity.title)} — ${escapeHtml(activity.city)}" />
  <meta property="og:description" content="${escapeHtml(activity.summary)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />${ogImageTag}
  <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="../styles/main.css" />
  <script type="application/ld+json">
    ${jsonLd}
  </script>
</head>
<body>
  <nav>
    <a href="../index.html" class="site-brand">Curious City</a>
    <div class="nav-links">
      <a href="../index.html">Home</a>
      <a href="../about.html">About</a>
      <a href="../contact.html">Contact</a>
      <a href="../privacy.html">Privacy</a>
    </div>
  </nav>
  <main class="spot-page">
    <a class="back-link" href="../index.html#activity-form">&larr; Back to search</a>
    ${renderPhotoHtml(activity)}
    <div class="spot-page-body">
      ${localPickBadge}
      <h1>${escapeHtml(activity.title)}</h1>
      <p class="spot-page-city">${escapeHtml(activity.city)}</p>
      ${renderDescriptionHtml(activity)}
      <p class="activity-address">${escapeHtml(activity.address)}</p>
      <p class="activity-maps">${mapsLinkHtml}</p>
      <p class="activity-access">${escapeHtml(activity.access)}</p>
      <div class="activity-tags">${renderTagsHtml(activity.interests)}</div>
      <div class="activity-links">${officialLinkHtml}</div>
    </div>
  </main>
</body>
</html>
`;
}
