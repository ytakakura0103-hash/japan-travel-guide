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

export function renderSpotList(container, spots) {
  if (spots.length === 0) {
    container.innerHTML = '<p class="no-results">No hidden gems match your filters yet. Try widening your search.</p>';
    return;
  }

  container.innerHTML = spots
    .map(
      (spot) => `
        <article class="spot-card">
          <h3>${escapeHtml(spot.name)}</h3>
          <p>${escapeHtml(spot.description)}</p>
        </article>
      `
    )
    .join('');
}
