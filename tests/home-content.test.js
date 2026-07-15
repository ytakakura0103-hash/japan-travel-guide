import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf-8');

describe('index.html', () => {
  it('links to the itinerary planner, hidden gems, and privacy pages', () => {
    expect(html).toContain('href="itinerary.html"');
    expect(html).toContain('href="spots.html"');
    expect(html).toContain('href="privacy.html"');
  });

  it('renders the route hero with a headline and both primary actions', () => {
    expect(html).toContain('class="hero"');
    expect(html).toContain('class="hero-route"');
    expect(html).toContain('<h1>Find Your Route Through Japan</h1>');
    expect(html).toMatch(/class="button button-primary" href="itinerary\.html"/);
    expect(html).toMatch(/class="button button-secondary" href="spots\.html"/);
  });
});
