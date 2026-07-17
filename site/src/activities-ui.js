import { renderAffiliateLinkHtml } from './affiliate.js';

export function escapeHtml(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const INTEREST_LABELS = {
  sightseeing: 'Sightseeing Spots',
  history: 'History',
  food: 'Food & Dining',
  shopping: 'Shopping',
  nature: 'Nature & Parks',
  'temples-shrines': 'Temples & Shrines',
  nightlife: 'Nightlife',
  'pop-culture': 'Anime & Pop Culture',
  'traditional-culture': 'Traditional Crafts & Culture',
  'art-museums': 'Art & Museums',
  'local-markets': 'Local Markets',
  'cafes-sweets': 'Cafes & Sweets',
  onsen: 'Onsen & Relaxation',
  festivals: 'Festivals & Events',
  architecture: 'Architecture',
  'photo-spots': 'Photo Spots',
  family: 'Family-Friendly',
  outdoor: 'Outdoor & Sports',
  backstreets: 'Backstreets & Local Neighborhoods',
  'seasonal-nature': 'Seasonal Nature (Cherry Blossoms / Autumn Leaves)',
};

export function renderTagsHtml(interests) {
  return (interests || [])
    .map((interest) => `<span class="tag">${escapeHtml(INTEREST_LABELS[interest] || interest)}</span>`)
    .join('');
}

export function renderPhotoHtml(activity) {
  if (activity.imageUrl) {
    const img = `<img class="activity-photo" src="${escapeHtml(activity.imageUrl)}" alt="${escapeHtml(activity.title)}" loading="lazy" />`;
    if (activity.imageCredit) {
      const { photographerName, photographerUrl, unsplashUrl } = activity.imageCredit;
      const credit = `<span class="photo-credit">Photo by <a href="${escapeHtml(photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(photographerName)}</a> on <a href="${escapeHtml(unsplashUrl)}" target="_blank" rel="noopener">Unsplash</a></span>`;
      return `<div class="activity-photo-wrap">${img}${credit}</div>`;
    }
    return img;
  }
  return '<div class="activity-photo activity-photo-placeholder" aria-hidden="true"></div>';
}

export function buildGoogleMapsUrl(activity) {
  const query =
    activity.mapsQuery ||
    (activity.address ? `${activity.title}, ${activity.address}` : `${activity.title}, ${activity.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function renderActivityResults(container, activities) {
  if (activities.length === 0) {
    container.innerHTML = '<p class="no-results">No activities match your filters yet. Try widening your search.</p>';
    return;
  }

  container.innerHTML = activities
    .map((activity) => {
      const localPickBadge = activity.isLocalPick ? '<span class="local-pick-badge">Local Pick</span>' : '';
      return `
        <article class="activity-card">
          ${renderPhotoHtml(activity)}
          <div class="activity-card-body">
            ${localPickBadge}
            <h3><a href="spots/${escapeHtml(activity.id)}.html">${escapeHtml(activity.title)}</a></h3>
            <p>${escapeHtml(activity.summary)}</p>
            <div class="activity-tags">${renderTagsHtml(activity.interests)}</div>
          </div>
        </article>
      `;
    })
    .join('');
}
