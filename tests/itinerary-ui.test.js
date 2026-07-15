// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderItineraryResults } from '../site/src/itinerary-ui.js';

describe('renderItineraryResults', () => {
  it('shows a message when there are no results', () => {
    const container = document.createElement('div');
    renderItineraryResults(container, []);
    expect(container.querySelector('.no-results')).not.toBeNull();
  });

  it('renders one card per itinerary with a title, summary, and affiliate links', () => {
    const container = document.createElement('div');
    renderItineraryResults(container, [
      {
        id: 'a',
        title: '3-Day Tokyo Culture Trip',
        summary: 'Temples, food, and Shibuya at night.',
        affiliateLinks: [{ label: 'Book a food tour', url: 'https://example.com/x', provider: 'Klook' }],
      },
    ]);
    const cards = container.querySelectorAll('.itinerary-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].querySelector('h3').textContent).toBe('3-Day Tokyo Culture Trip');
    expect(cards[0].querySelector('.affiliate-link')).not.toBeNull();
  });

  it('escapes HTML entities in title and summary', () => {
    const container = document.createElement('div');
    renderItineraryResults(container, [
      {
        id: 'b',
        title: '3-Day Tokyo Culture & Food Highlights',
        summary: 'Explore <temples> and "authentic" cuisine',
        affiliateLinks: [],
      },
    ]);
    const card = container.querySelector('.itinerary-card');
    const h3Html = card.querySelector('h3').innerHTML;
    const pHtml = card.querySelector('p').innerHTML;

    expect(h3Html).toContain('&amp;');
    expect(h3Html).not.toContain('&<');
    expect(pHtml).toContain('&lt;');
    expect(pHtml).toContain('&gt;');
    expect(pHtml).not.toContain('<temples>');
  });
});
