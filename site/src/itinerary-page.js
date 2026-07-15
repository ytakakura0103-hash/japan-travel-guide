import { filterItineraries } from './itinerary.js';
import { renderItineraryResults } from './itinerary-ui.js';

async function main() {
  const response = await fetch('data/itineraries.json');
  const itineraries = await response.json();
  const form = document.getElementById('itinerary-form');
  const results = document.getElementById('results');

  renderItineraryResults(results, itineraries);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const days = formData.get('days') ? Number(formData.get('days')) : undefined;
    const area = formData.get('area') || undefined;
    renderItineraryResults(results, filterItineraries(itineraries, { days, area }));
  });
}

main();
