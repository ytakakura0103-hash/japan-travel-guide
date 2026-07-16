// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderActivityResults } from '../site/src/activities-ui.js';

describe('renderActivityResults', () => {
  it('shows a message when there are no results', () => {
    const container = document.createElement('div');
    renderActivityResults(container, []);
    expect(container.querySelector('.no-results')).not.toBeNull();
  });

  it('renders one card per activity with title, summary, address, access, and tags', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'a',
        title: 'Senso-ji Temple',
        city: 'Tokyo',
        summary: "Tokyo's oldest temple.",
        address: '2-3-1 Asakusa, Taito City, Tokyo',
        access: '5-minute walk from Asakusa Station',
        interests: ['temples-shrines', 'history'],
        affiliateLinks: [],
      },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].querySelector('h3').textContent).toBe('Senso-ji Temple');
    expect(cards[0].querySelector('.activity-address').textContent).toBe('2-3-1 Asakusa, Taito City, Tokyo');
    expect(cards[0].querySelector('.activity-access').textContent).toBe('5-minute walk from Asakusa Station');
    const tags = cards[0].querySelectorAll('.tag');
    expect(tags).toHaveLength(2);
    expect(tags[0].textContent).toBe('Temples & Shrines');
  });

  it('shows a photo placeholder when imageUrl is missing, and a real image when present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'No Photo', city: 'Tokyo', summary: 's', address: 'a', access: 'a', interests: [], affiliateLinks: [] },
      {
        id: 'b',
        title: 'Has Photo',
        city: 'Tokyo',
        summary: 's',
        address: 'a',
        access: 'a',
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

  it('shows a Local Pick badge only when isLocalPick is true', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'Regular', city: 'Tokyo', summary: 's', address: 'a', access: 'a', interests: [], isLocalPick: false, affiliateLinks: [] },
      { id: 'b', title: 'Hidden Gem', city: 'Tokyo', summary: 's', address: 'a', access: 'a', interests: [], isLocalPick: true, affiliateLinks: [] },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards[0].querySelector('.local-pick-badge')).toBeNull();
    expect(cards[1].querySelector('.local-pick-badge').textContent).toBe('Local Pick');
  });

  it('shows an official site link only when officialUrl is present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'No Official', city: 'Tokyo', summary: 's', address: 'a', access: 'a', interests: [], affiliateLinks: [] },
      { id: 'b', title: 'Has Official', city: 'Tokyo', summary: 's', address: 'a', access: 'a', interests: [], officialUrl: 'https://example.com', affiliateLinks: [] },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards[0].querySelector('.official-link')).toBeNull();
    expect(cards[1].querySelector('.official-link').getAttribute('href')).toBe('https://example.com');
  });

  it('links to Google Maps using the address when present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'a',
        title: 'Senso-ji Temple',
        city: 'Tokyo',
        summary: 's',
        address: '2-3-1 Asakusa, Taito City, Tokyo',
        access: 'a',
        interests: [],
        affiliateLinks: [],
      },
    ]);
    const card = container.querySelector('.activity-card');
    const mapsLink = card.querySelector('.maps-link');
    expect(mapsLink).not.toBeNull();
    expect(mapsLink.textContent).toBe('Open in Google Maps');
    expect(mapsLink.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Senso-ji%20Temple%2C%202-3-1%20Asakusa%2C%20Taito%20City%2C%20Tokyo'
    );
  });

  it('falls back to title and city for the Google Maps link when address is missing', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'Mystery Spot', city: 'Osaka', summary: 's', address: '', access: 'a', interests: [], affiliateLinks: [] },
    ]);
    const card = container.querySelector('.activity-card');
    const mapsLink = card.querySelector('.maps-link');
    expect(mapsLink.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Mystery%20Spot%2C%20Osaka'
    );
  });

  it('escapes HTML entities in title, summary, address, and access', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'c',
        title: 'A <Secret> & "Special" Spot',
        city: 'Tokyo',
        summary: 'Explore <hidden> corners',
        address: '1 <Chome> & Main St, Tokyo',
        access: 'Near "Main" <St> & 5th',
        interests: [],
        affiliateLinks: [],
      },
    ]);
    const card = container.querySelector('.activity-card');
    const h3Html = card.querySelector('h3').innerHTML;
    const pHtml = card.querySelector('p').innerHTML;
    const addressHtml = card.querySelector('.activity-address').innerHTML;
    const accessHtml = card.querySelector('.activity-access').innerHTML;
    expect(h3Html).toContain('&lt;Secret&gt;');
    expect(h3Html).not.toContain('<Secret>');
    expect(pHtml).toContain('&lt;hidden&gt;');
    expect(pHtml).not.toContain('<hidden>');
    expect(addressHtml).toContain('&lt;Chome&gt;');
    expect(addressHtml).not.toContain('<Chome>');
    expect(accessHtml).toContain('&lt;St&gt;');
    expect(accessHtml).not.toContain('<St>');
  });
});
