import { filterSpots } from './spots.js';
import { renderSpotList } from './spots-ui.js';

async function main() {
  const response = await fetch('data/spots.json');
  const spots = await response.json();
  const form = document.getElementById('spots-form');
  const results = document.getElementById('results');

  renderSpotList(results, spots);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const area = formData.get('area') || undefined;
    renderSpotList(results, filterSpots(spots, { area }));
  });
}

main();
