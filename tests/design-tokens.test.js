import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../site/styles/main.css', import.meta.url), 'utf-8');

describe('design tokens', () => {
  it('defines a white background and the brand/accent/tag colors as CSS custom properties', () => {
    expect(css).toMatch(/--color-bg:\s*#FFFFFF/);
    expect(css).toMatch(/--color-brand:\s*#1F3F5C/);
    expect(css).toMatch(/--color-accent:\s*#BD3B26/);
    expect(css).toMatch(/--color-tag:\s*#6B7A4F/);
  });

  it('defines a single body font family with no separate display face', () => {
    expect(css).toMatch(/--font-body:\s*'Karla'/);
    expect(css).not.toMatch(/--font-display/);
  });
});

describe('Google Fonts loading', () => {
  const pages = ['index.html', 'privacy.html'];

  it.each(pages)('%s references the Google Fonts stylesheet', (page) => {
    const html = readFileSync(new URL(`../site/${page}`, import.meta.url), 'utf-8');
    expect(html).toContain('fonts.googleapis.com');
  });
});
