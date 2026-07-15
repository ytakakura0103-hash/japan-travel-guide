// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSpotList } from '../site/src/spots-ui.js';

describe('renderSpotList', () => {
  it('shows a message when there are no results', () => {
    const container = document.createElement('div');
    renderSpotList(container, []);
    expect(container.querySelector('.no-results')).not.toBeNull();
  });

  it('renders one card per spot with a name and description', () => {
    const container = document.createElement('div');
    renderSpotList(container, [
      { id: 'x', name: 'Yanaka Ginza', description: 'An old-town shopping street away from the crowds.' },
    ]);
    const cards = container.querySelectorAll('.spot-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].querySelector('h3').textContent).toBe('Yanaka Ginza');
  });

  it('escapes HTML entities in name and description', () => {
    const container = document.createElement('div');
    renderSpotList(container, [
      {
        id: 'y',
        name: 'Tokyo <Secret> & Kyoto Spot',
        description: 'Explore <hidden> corners and "authentic" backstreets',
      },
    ]);
    const card = container.querySelector('.spot-card');
    const h3Html = card.querySelector('h3').innerHTML;
    const pHtml = card.querySelector('p').innerHTML;

    expect(h3Html).toContain('&lt;Secret&gt;');
    expect(h3Html).not.toContain('<Secret>');
    expect(h3Html).toContain('&amp;');
    expect(pHtml).toContain('&lt;');
    expect(pHtml).toContain('&gt;');
    expect(pHtml).not.toContain('<hidden>');
  });
});
