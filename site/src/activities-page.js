import { filterActivities } from './activities.js';
import { renderActivityResults } from './activities-ui.js';

async function main() {
  const response = await fetch('data/activities.json');
  const activities = await response.json();
  const form = document.getElementById('activity-form');
  const results = document.getElementById('results');

  renderActivityResults(results, activities);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const city = formData.get('city') || undefined;
    const interests = formData.getAll('interests');
    renderActivityResults(results, filterActivities(activities, { city, interests }));
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
