// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const fixtureActivities = [
  {
    id: 'senso-ji-temple',
    title: 'Senso-ji Temple',
    city: 'Tokyo',
    summary: "Tokyo's oldest temple.",
    interests: ['temples-shrines'],
    affiliateLinks: [],
  },
  {
    id: 'osaka-castle-park',
    title: 'Osaka Castle Park',
    city: 'Osaka',
    summary: 'A big park with a castle.',
    interests: ['history', 'nature'],
    affiliateLinks: [],
  },
];

function setUpDom() {
  document.body.innerHTML = `
    <form id="activity-form">
      <select name="city">
        <option value="">Any</option>
        <option value="Tokyo">Tokyo</option>
        <option value="Osaka">Osaka</option>
      </select>
      <label><input type="checkbox" name="interests" value="history" /></label>
      <label><input type="checkbox" name="interests" value="nature" /></label>
      <label><input type="checkbox" name="interests" value="temples-shrines" /></label>
      <button type="submit">Search</button>
    </form>
    <div id="results"></div>
  `;
}

async function loadPageModule() {
  vi.resetModules();
  await import('../site/src/activities-page.js');
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('activities-page', () => {
  beforeEach(() => {
    setUpDom();
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(fixtureActivities),
    });
    history.pushState(null, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies the city and interests filters from the URL on load', async () => {
    history.pushState(null, '', '/?city=Osaka&interests=history');
    await loadPageModule();

    const citySelect = document.querySelector('select[name="city"]');
    expect(citySelect.value).toBe('Osaka');
    const historyCheckbox = document.querySelector('input[value="history"]');
    expect(historyCheckbox.checked).toBe(true);
    const natureCheckbox = document.querySelector('input[value="nature"]');
    expect(natureCheckbox.checked).toBe(false);

    const cards = document.querySelectorAll('.activity-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Osaka Castle Park');
  });

  it('updates the URL when the form is submitted, so filters survive a reload', async () => {
    await loadPageModule();

    const form = document.getElementById('activity-form');
    form.querySelector('select[name="city"]').value = 'Osaka';
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    expect(window.location.search).toContain('city=Osaka');
  });

  it('re-applies filters from the URL when the user navigates back (popstate)', async () => {
    await loadPageModule();

    const form = document.getElementById('activity-form');
    form.querySelector('select[name="city"]').value = 'Osaka';
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    let cards = document.querySelectorAll('.activity-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Osaka');

    // Simulate the browser restoring the previous (unfiltered) history entry.
    history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    cards = document.querySelectorAll('.activity-card');
    expect(cards).toHaveLength(2);
    expect(document.querySelector('select[name="city"]').value).toBe('');
  });
});
