import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../site/styles/main.css', import.meta.url), 'utf-8');

describe('design tokens', () => {
  it('defines the core color palette as CSS custom properties', () => {
    expect(css).toMatch(/--color-gofun:\s*#F7F3EC/);
    expect(css).toMatch(/--color-sumi:\s*#221F1B/);
    expect(css).toMatch(/--color-ai:\s*#1F3F5C/);
    expect(css).toMatch(/--color-shu:\s*#BD3B26/);
  });

  it('defines the type scale font families', () => {
    expect(css).toMatch(/--font-display:\s*'Archivo'/);
    expect(css).toMatch(/--font-body:\s*'Karla'/);
    expect(css).toMatch(/--font-mono:\s*'IBM Plex Mono'/);
  });
});

describe('Google Fonts loading', () => {
  const pages = ['index.html', 'itinerary.html', 'spots.html', 'privacy.html'];

  it.each(pages)('%s references the Google Fonts stylesheet', (page) => {
    const html = readFileSync(new URL(`../site/${page}`, import.meta.url), 'utf-8');
    expect(html).toContain('fonts.googleapis.com');
  });
});
