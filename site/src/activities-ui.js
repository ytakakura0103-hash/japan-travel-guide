import { renderAffiliateLinkHtml } from './affiliate.js';

function escapeHtml(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const INTEREST_LABELS = {
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
  'seasonal-nature': 'Seasonal Nature',
};

function renderTagsHtml(interests) {
  return (interests || [])
    .map((interest) => `<span class="tag">${escapeHtml(INTEREST_LABELS[interest] || interest)}</span>`)
    .join('');
}

function renderPhotoHtml(activity) {
  if (activity.imageUrl) {
    return `<img class="activity-photo" src="${escapeHtml(activity.imageUrl)}" alt="${escapeHtml(activity.title)}" loading="lazy" />`;
  }
  return '<div class="activity-photo activity-photo-placeholder" aria-hidden="true"></div>';
}

export function renderActivityResults(container, activities) {
  if (activities.length === 0) {
    container.innerHTML = '<p class="no-results">No activities match your filters yet. Try widening your search.</p>';
    return;
  }

  container.innerHTML = activities
    .map((activity) => {
      const links = (activity.affiliateLinks || []).map(renderAffiliateLinkHtml).join('');
      const officialLink = activity.officialUrl
        ? `<a class="official-link" href="${escapeHtml(activity.officialUrl)}" target="_blank" rel="noopener">Official site</a>`
        : '';
      const localPickBadge = activity.isLocalPick ? '<span class="local-pick-badge">Local Pick</span>' : '';
      return `
        <article class="activity-card">
          ${renderPhotoHtml(activity)}
          <div class="activity-card-body">
            ${localPickBadge}
            <h3>${escapeHtml(activity.title)}</h3>
            <p>${escapeHtml(activity.summary)}</p>
            <p class="activity-access">${escapeHtml(activity.access)}</p>
            <div class="activity-tags">${renderTagsHtml(activity.interests)}</div>
            <div class="activity-links">${links}${officialLink}</div>
          </div>
        </article>
      `;
    })
    .join('');
}
