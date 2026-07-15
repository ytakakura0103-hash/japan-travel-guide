import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf-8');

describe('index.html', () => {
  it('links to the itinerary planner, hidden gems, and privacy pages', () => {
    expect(html).toContain('href="itinerary.html"');
    expect(html).toContain('href="spots.html"');
    expect(html).toContain('href="privacy.html"');
  });
});
