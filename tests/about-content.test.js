import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/about.html', import.meta.url), 'utf-8');

describe('about.html', () => {
  it('names the person behind the site', () => {
    expect(html).toMatch(/Yusuke/);
  });

  it('discloses relevant background', () => {
    expect(html).toMatch(/Kansai/i);
    expect(html).toMatch(/Airbnb Experiences/i);
  });

  it('provides a contact method', () => {
    expect(html).toMatch(/mailto:/);
  });

  it('is linked from the homepage nav and hero copy', () => {
    const indexHtml = readFileSync(new URL('../site/index.html', import.meta.url), 'utf-8');
    expect(indexHtml).toContain('href="about.html"');
  });

  it('discloses how listings are chosen and updated', () => {
    expect(html).toMatch(/how listings are chosen and updated/i);
  });

  it('discloses how the site makes money', () => {
    expect(html).toMatch(/how this site makes money/i);
    expect(html).toMatch(/affiliate links/i);
  });

  it('embeds Person structured data linked to the About page', () => {
    const match = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    expect(match).not.toBeNull();
    const jsonLd = JSON.parse(match[1]);
    expect(jsonLd['@type']).toBe('AboutPage');
    expect(jsonLd.mainEntity['@type']).toBe('Person');
    expect(jsonLd.mainEntity.name).toBe('Yusuke');
  });

  it('uses the cat photo avatar (not the AI-generated portrait)', () => {
    expect(html).toContain('media/yusuke-avatar-cat.jpg');
    expect(html).not.toContain('yusuke-avatar.svg');
    expect(html).not.toMatch(/yusuke-avatar\.jpg/);
  });
});
