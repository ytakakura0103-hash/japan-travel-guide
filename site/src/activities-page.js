import { filterActivities } from './activities.js';
import { renderActivityResults } from './activities-ui.js';

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city') || undefined;
  const interests = params.getAll('interests');
  return { city, interests };
}

function applyFiltersToForm(form, { city, interests }) {
  form.elements.city.value = city || '';
  for (const checkbox of form.querySelectorAll('input[name="interests"]')) {
    checkbox.checked = interests.includes(checkbox.value);
  }
}

function buildUrlFromFilters({ city, interests }) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  for (const interest of interests) params.append('interests', interest);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

async function main() {
  const response = await fetch('data/activities.json');
  const activities = await response.json();
  const form = document.getElementById('activity-form');
  const results = document.getElementById('results');

  const renderFromFilters = (filters) => {
    renderActivityResults(results, filterActivities(activities, filters));
  };

  const initialFilters = readFiltersFromUrl();
  applyFiltersToForm(form, initialFilters);
  renderFromFilters(initialFilters);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const filters = {
      city: formData.get('city') || undefined,
      interests: formData.getAll('interests'),
    };
    history.pushState(filters, '', buildUrlFromFilters(filters));
    renderFromFilters(filters);
  });

  window.addEventListener('popstate', () => {
    const filters = readFiltersFromUrl();
    applyFiltersToForm(form, filters);
    renderFromFilters(filters);
  });
}

function initBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button) return;

  const toggleVisibility = () => {
    button.classList.toggle('is-visible', window.scrollY > 400);
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
}

main();
initBackToTop();
