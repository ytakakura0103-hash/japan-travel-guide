import { renderAffiliateLinkHtml } from './affiliate.js';

export function renderItineraryResults(container, itineraries) {
  if (itineraries.length === 0) {
    container.innerHTML = '<p class="no-results">No itineraries match your filters yet. Try widening your search.</p>';
    return;
  }

  container.innerHTML = itineraries
    .map((itinerary) => {
      const links = (itinerary.affiliateLinks || []).map(renderAffiliateLinkHtml).join('');
      return `
        <article class="itinerary-card">
          <h3>${itinerary.title}</h3>
          <p>${itinerary.summary}</p>
          <div class="itinerary-links">${links}</div>
        </article>
      `;
    })
    .join('');
}
