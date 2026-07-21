import { filterActivities } from './activities.js';
import { renderActivityResults } from './activities-ui.js';

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city') || undefined;
  const interests = params.getAll('interests');
  return { city, interests };
}

function readFiltersFromForm(form) {
  const formData = new FormData(form);
  return {
    city: formData.get('city') || undefined,
    interests: formData.getAll('interests'),
  };
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
  const interestGrid = document.getElementById('interest-grid');
  const filtersToggle = document.getElementById('filters-toggle');

  const renderFromFilters = (filters) => {
    renderActivityResults(results, filterActivities(activities, filters));
  };

  const expandInterestGrid = () => {
    if (!interestGrid || !filtersToggle) return;
    interestGrid.hidden = false;
    filtersToggle.setAttribute('aria-expanded', 'true');
  };

  const navigateToFilters = (filters) => {
    history.pushState(filters, '', buildUrlFromFilters(filters));
    applyFiltersToForm(form, filters);
    renderFromFilters(filters);
  };

  const initialFilters = readFiltersFromUrl();
  applyFiltersToForm(form, initialFilters);
  renderFromFilters(initialFilters);
  if (initialFilters.interests.length > 0) {
    expandInterestGrid();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    navigateToFilters(readFiltersFromForm(form));
  });

  window.addEventListener('popstate', () => {
    const filters = readFiltersFromUrl();
    applyFiltersToForm(form, filters);
    renderFromFilters(filters);
    if (filters.interests.length > 0) {
      expandInterestGrid();
    }
  });

  if (filtersToggle && interestGrid) {
    filtersToggle.addEventListener('click', () => {
      const isExpanded = filtersToggle.getAttribute('aria-expanded') === 'true';
      interestGrid.hidden = isExpanded;
      filtersToggle.setAttribute('aria-expanded', String(!isExpanded));
    });
  }

  const cityGrid = document.querySelector('.city-photo-grid');
  if (cityGrid) {
    cityGrid.addEventListener('click', (event) => {
      const tile = event.target.closest('.city-tile');
      if (!tile) return;
      event.preventDefault();
      const { interests } = readFiltersFromForm(form);
      navigateToFilters({ city: tile.dataset.city, interests });
      results.scrollIntoView?.({ block: 'start' });
    });
  }
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
