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

function renderRouteHtml(days) {
  const stops = Array.from({ length: days || 0 }, (_, index) => index + 1);
  return `
    <div class="route" role="img" aria-label="${days}-day route">
      ${stops
        .map(
          (stop, index) => `
            <span class="route-stop">
              <span class="route-marker">${stop}</span>
              ${index < stops.length - 1 ? '<span class="route-line" aria-hidden="true"></span>' : ''}
            </span>
          `
        )
        .join('')}
    </div>
  `;
}

export function renderItineraryResults(container, itineraries) {
  if (itineraries.length === 0) {
    container.innerHTML = '<p class="no-results">No routes match your filters yet. Try widening your search.</p>';
    return;
  }

  container.innerHTML = itineraries
    .map((itinerary) => {
      const links = (itinerary.affiliateLinks || []).map(renderAffiliateLinkHtml).join('');
      const routeSection = itinerary.days
        ? `
          <span class="route-label">${itinerary.days}-Stop Route</span>
          ${renderRouteHtml(itinerary.days)}
        `
        : '';
      return `
        <article class="itinerary-card">
          ${routeSection}
          <h3>${escapeHtml(itinerary.title)}</h3>
          <p>${escapeHtml(itinerary.summary)}</p>
          <div class="itinerary-links">${links}</div>
        </article>
      `;
    })
    .join('');
}
