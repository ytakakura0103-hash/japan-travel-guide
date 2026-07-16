// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderActivityResults } from '../site/src/activities-ui.js';

describe('renderActivityResults', () => {
  it('shows a message when there are no results', () => {
    const container = document.createElement('div');
    renderActivityResults(container, []);
    expect(container.querySelector('.no-results')).not.toBeNull();
  });

  it('renders one card per activity with title, summary, access, and tags', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'a',
        title: 'Senso-ji Temple',
        summary: "Tokyo's oldest temple.",
        access: '5-minute walk from Asakusa Station',
        interests: ['temples-shrines', 'history'],
        affiliateLinks: [],
      },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].querySelector('h3').textContent).toBe('Senso-ji Temple');
    expect(cards[0].querySelector('.activity-access').textContent).toBe('5-minute walk from Asakusa Station');
    const tags = cards[0].querySelectorAll('.tag');
    expect(tags).toHaveLength(2);
    expect(tags[0].textContent).toBe('Temples & Shrines');
  });

  it('shows a photo placeholder when imageUrl is missing, and a real image when present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'No Photo', summary: 's', access: 'a', interests: [], affiliateLinks: [] },
      {
        id: 'b',
        title: 'Has Photo',
        summary: 's',
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
      { id: 'a', title: 'Regular', summary: 's', access: 'a', interests: [], isLocalPick: false, affiliateLinks: [] },
      { id: 'b', title: 'Hidden Gem', summary: 's', access: 'a', interests: [], isLocalPick: true, affiliateLinks: [] },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards[0].querySelector('.local-pick-badge')).toBeNull();
    expect(cards[1].querySelector('.local-pick-badge').textContent).toBe('Local Pick');
  });

  it('shows an official site link only when officialUrl is present', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      { id: 'a', title: 'No Official', summary: 's', access: 'a', interests: [], affiliateLinks: [] },
      { id: 'b', title: 'Has Official', summary: 's', access: 'a', interests: [], officialUrl: 'https://example.com', affiliateLinks: [] },
    ]);
    const cards = container.querySelectorAll('.activity-card');
    expect(cards[0].querySelector('.official-link')).toBeNull();
    expect(cards[1].querySelector('.official-link').getAttribute('href')).toBe('https://example.com');
  });

  it('escapes HTML entities in title, summary, and access', () => {
    const container = document.createElement('div');
    renderActivityResults(container, [
      {
        id: 'c',
        title: 'A <Secret> & "Special" Spot',
        summary: 'Explore <hidden> corners',
        access: 'Near "Main" <St> & 5th',
        interests: [],
        affiliateLinks: [],
      },
    ]);
    const card = container.querySelector('.activity-card');
    const h3Html = card.querySelector('h3').innerHTML;
    const pHtml = card.querySelector('p').innerHTML;
    const accessHtml = card.querySelector('.activity-access').innerHTML;
    expect(h3Html).toContain('&lt;Secret&gt;');
    expect(h3Html).not.toContain('<Secret>');
    expect(pHtml).toContain('&lt;hidden&gt;');
    expect(pHtml).not.toContain('<hidden>');
    expect(accessHtml).toContain('&lt;St&gt;');
    expect(accessHtml).not.toContain('<St>');
  });
});
