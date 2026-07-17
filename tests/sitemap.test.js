import { describe, it, expect } from 'vitest';
import { buildSitemapXml } from '../site/src/sitemap.js';

describe('buildSitemapXml', () => {
  it('includes the homepage, the about page, and one entry per activity', () => {
    const xml = buildSitemapXml(
      [
        { id: 'senso-ji-temple' },
        { id: 'nakano-broadway' },
      ],
      'https://example.com'
    );
    const locCount = (xml.match(/<loc>/g) || []).length;
    expect(locCount).toBe(4);
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/about.html</loc>');
    expect(xml).toContain('<loc>https://example.com/spots/senso-ji-temple.html</loc>');
    expect(xml).toContain('<loc>https://example.com/spots/nakano-broadway.html</loc>');
  });

  it('produces well-formed XML with a single urlset root', () => {
    const xml = buildSitemapXml([{ id: 'a' }], 'https://example.com');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect((xml.match(/<urlset/g) || []).length).toBe(1);
    expect((xml.match(/<\/urlset>/g) || []).length).toBe(1);
  });
});
