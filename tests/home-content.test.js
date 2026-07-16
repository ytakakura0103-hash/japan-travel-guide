import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf-8');

describe('index.html', () => {
  it('links to the privacy page and no longer to the removed itinerary/spots pages', () => {
    expect(html).toContain('href="privacy.html"');
    expect(html).not.toContain('href="itinerary.html"');
    expect(html).not.toContain('href="spots.html"');
  });

  it('renders a city select and a search submit button', () => {
    expect(html).toContain('name="city"');
    expect(html).toContain('class="search-submit"');
  });

  it('renders all 20 interest checkboxes', () => {
    const matches = html.match(/name="interests"/g) || [];
    expect(matches).toHaveLength(20);
  });

  it('includes a results container', () => {
    expect(html).toContain('id="results"');
  });

  it('includes a back-to-top link pointing at the search form', () => {
    expect(html).toContain('id="back-to-top"');
    expect(html).toContain('href="#activity-form"');
  });
});
