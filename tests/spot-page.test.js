import { describe, it, expect } from 'vitest';
import { renderSpotPageHtml, buildSpotPath } from '../site/src/spot-page.js';

const baseActivity = {
  id: 'senso-ji-temple',
  title: 'Senso-ji Temple',
  city: 'Tokyo',
  summary: "Tokyo's oldest temple.",
  address: '2-3-1 Asakusa, Taito City, Tokyo',
  access: '5-minute walk from Asakusa Station',
  interests: ['temples-shrines'],
  officialUrl: 'https://www.senso-ji.jp/',
  isLocalPick: true,
};

describe('buildSpotPath', () => {
  it('builds the relative path for a spot id', () => {
    expect(buildSpotPath('senso-ji-temple')).toBe('spots/senso-ji-temple.html');
  });
});

describe('renderSpotPageHtml', () => {
  it('includes the title, canonical URL, and description meta tag', () => {
    const html = renderSpotPageHtml(baseActivity, { siteUrl: 'https://example.com' });
    expect(html).toContain('<title>Senso-ji Temple — Tokyo | Curious City</title>');
    expect(html).toContain('<link rel="canonical" href="https://example.com/spots/senso-ji-temple.html" />');
    expect(html).toContain('content="Tokyo\'s oldest temple."');
  });

  it('includes OGP tags matching the canonical URL', () => {
    const html = renderSpotPageHtml(baseActivity, { siteUrl: 'https://example.com' });
    expect(html).toContain('<meta property="og:url" content="https://example.com/spots/senso-ji-temple.html" />');
    expect(html).toContain('<meta property="og:title" content="Senso-ji Temple — Tokyo" />');
  });

  it('embeds valid TouristAttraction JSON-LD', () => {
    const html = renderSpotPageHtml(baseActivity, { siteUrl: 'https://example.com' });
    const match = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    expect(match).not.toBeNull();
    const jsonLd = JSON.parse(match[1]);
    expect(jsonLd['@type']).toBe('TouristAttraction');
    expect(jsonLd.name).toBe('Senso-ji Temple');
    expect(jsonLd.url).toBe('https://example.com/spots/senso-ji-temple.html');
  });

  it('renders the Google Maps link, official link, and Local Pick badge', () => {
    const html = renderSpotPageHtml(baseActivity, { siteUrl: 'https://example.com' });
    expect(html).toContain('Open in Google Maps');
    expect(html).toContain('official-link');
    expect(html).toContain('local-pick-badge');
  });

  it('escapes HTML in the title and summary', () => {
    const html = renderSpotPageHtml(
      { ...baseActivity, title: 'A <Secret> Spot', summary: 'Has <script> in it' },
      { siteUrl: 'https://example.com' }
    );
    expect(html).toContain('&lt;Secret&gt;');
    expect(html).not.toContain('<Secret>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script> in it');
  });

  it('defaults to the placeholder domain when no siteUrl is given', () => {
    const html = renderSpotPageHtml(baseActivity);
    expect(html).toContain('https://REPLACE_WITH_YOUR_DOMAIN/spots/senso-ji-temple.html');
  });

  it('renders the long-form description as separate paragraphs when present', () => {
    const html = renderSpotPageHtml(
      { ...baseActivity, description: 'First paragraph.\n\nSecond paragraph.' },
      { siteUrl: 'https://example.com' }
    );
    expect(html).toContain('<p>First paragraph.</p>');
    expect(html).toContain('<p>Second paragraph.</p>');
  });

  it('falls back to the summary when no description is present', () => {
    const html = renderSpotPageHtml(baseActivity, { siteUrl: 'https://example.com' });
    expect(html).toContain("<p>Tokyo's oldest temple.</p>");
  });

  it('keeps the meta description short (uses summary, not the long-form description)', () => {
    const html = renderSpotPageHtml(
      { ...baseActivity, description: 'First paragraph.\n\nSecond paragraph.' },
      { siteUrl: 'https://example.com' }
    );
    expect(html).toContain('content="Tokyo\'s oldest temple."');
  });
});
