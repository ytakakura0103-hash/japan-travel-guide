// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderActivityResults, buildGoogleMapsUrl } from '../site/src/activities-ui.js';

describe('buildGoogleMapsUrl', () => {
  it('combines title and address by default', () => {
    const url = buildGoogleMapsUrl({ title: 'Senso-ji Temple', address: '2-3-1 Asakusa, Taito City, Tokyo' });
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=Senso-ji%20Temple%2C%202-3-1%20Asakusa%2C%20Taito%20City%2C%20Tokyo'
    );
  });

  it('falls back to title and city when address is missing', () => {
    const url = buildGoogleMapsUrl({ title: 'Mystery Spot', city: 'Osaka', address: '' });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Mystery%20Spot%2C%20Osaka');
  });

  it('uses mapsQuery instead of title+address when the title is not a searchable place name', () => {
    const url = buildGoogleMapsUrl({
      title: 'Shimokitazawa Backstreets',
      address: 'Shimokitazawa area, Setagaya City, Tokyo',
      mapsQuery: 'Shimokitazawa area, Setagaya City, Tokyo',
    });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Shimokitazawa%20area%2C%20Setagaya%20City%2C%20Tokyo');
  });
});

describe('renderActivityResults', () => {
  it('shows a message when there are no results', () => {
    const container = document.createElement('div');
    renderActivityResults(container, []);
    expect(container.querySelector('.no-results')).not.toBeNull();
  });

  it('renders one card per activity with title, summary, and tags', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'a',
        title: 'Senso-ji Temple',
        city: 'Tokyo',
        summary: "Tokyo's oldest temple.",
        interests: ['temples-shrines', 'history'],
        affiliateLinks: [],
      },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].querySelector('h3').textContent).toBe('Senso-ji Temple');
    expect(cards[0].querySelector('p').textContent).toBe("Tokyo's oldest temple.");
    const tags = cards[0].querySelectorAll('.tag');
    expect(tags).toHaveLength(2);
    expect(tags[0].textContent).toBe('Temples & Shrines');
  });

  it('links the card title to the spot detail page', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'senso-ji-temple',
        title: 'Senso-ji Temple',
        city: 'Tokyo',
        summary: "Tokyo's oldest temple.",
        interests: [],
        affiliateLinks: [],
      },
    ]);
    const titleLink = container.querySelector('.activity-card h3 a');
    expect(titleLink.getAttribute('href')).toBe('spots/senso-ji-temple.html');
    expect(titleLink.textContent).toBe('Senso-ji Temple');
  });

  it('shows a photo placeholder when imageUrl is missing, and a real image when present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'No Photo', city: 'Tokyo', summary: 's', interests: [], affiliateLinks: [] },
      {
        id: 'b',
        title: 'Has Photo',
        city: 'Tokyo',
        summary: 's',
        interests: [],
        imageUrl: 'https://example.com/photo.jpg',
        affiliateLinks: [],
      },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards[0].querySelector('.activity-photo-placeholder')).not.toBeNull();
    expect(cards[0].querySelector('img')).toBeNull();
    expect(cards[1].querySelector('img').getAttribute('src')).toBe('https://example.com/photo.jpg');
    expect(cards[1].querySelector('.activity-photo-placeholder')).toBeNull();
  });

  it('shows a Wikimedia Commons photo credit when imageCredit is present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'a',
        title: 'Has Credit',
        city: 'Tokyo',
        summary: 's',
        interests: [],
        imageUrl: 'https://example.com/photo.jpg',
        imageCredit: {
          author: 'Jane Doe',
          licenseName: 'CC BY-SA 4.0',
          fileUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        },
        affiliateLinks: [],
      },
    ]);
    const credit = container.querySelector('.photo-credit');
    expect(credit).not.toBeNull();
    expect(credit.textContent).toBe('Photo: Jane Doe (CC BY-SA 4.0)');
    const link = credit.querySelector('a');
    expect(link.getAttribute('href')).toBe('https://commons.wikimedia.org/wiki/File:Example.jpg');
  });

  it('shows a Local Pick badge only when isLocalPick is true', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'Regular', city: 'Tokyo', summary: 's', interests: [], isLocalPick: false, affiliateLinks: [] },
      { id: 'b', title: 'Hidden Gem', city: 'Tokyo', summary: 's', interests: [], isLocalPick: true, affiliateLinks: [] },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards[0].querySelector('.local-pick-badge')).toBeNull();
    expect(cards[1].querySelector('.local-pick-badge').textContent).toBe('Local Pick');
  });

  it('escapes HTML entities in title and summary', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'c',
        title: 'A <Secret> & "Special" Spot',
        city: 'Tokyo',
        summary: 'Explore <hidden> corners',
        interests: [],
        affiliateLinks: [],
      },
    ]);
    const card = container.querySelector('.activity-card');
    const h3Html = card.querySelector('h3').innerHTML;
    const pHtml = card.querySelector('p').innerHTML;
    expect(h3Html).toContain('&lt;Secret&gt;');
    expect(h3Html).not.toContain('<Secret>');
    expect(pHtml).toContain('&lt;hidden&gt;');
    expect(pHtml).not.toContain('<hidden>');
  });
});
