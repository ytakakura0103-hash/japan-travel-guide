import { describe, it, expect } from 'vitest';
import { buildAffiliateLink, renderAffiliateLinkHtml } from '../site/src/affiliate.js';

describe('buildAffiliateLink', () => {
  it('builds a link object with a PR disclosure', () => {
    const link = buildAffiliateLink({ label: 'Book a tour', url: 'https://example.com/x', provider: 'Klook' });
    expect(link).toEqual({
      label: 'Book a tour',
      url: 'https://example.com/x',
      provider: 'Klook',
      disclosureText: 'PR',
    });
  });

  it('throws when required fields are missing', () => {
    expect(() => buildAffiliateLink({ label: 'Book a tour' })).toThrow(
      'buildAffiliateLink requires label, url, and provider'
    );
  });
});

describe('renderAffiliateLinkHtml', () => {
  it('renders an anchor tag with rel=sponsored and a visible PR disclosure', () => {
    const html = renderAffiliateLinkHtml({ label: 'Book a tour', url: 'https://example.com/x', provider: 'Klook' });
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain('rel="noopener sponsored"');
    expect(html).toContain('Book a tour (Klook)');
    expect(html).toContain('[PR]');
  });

  it('escapes HTML entities in label, url, and provider to prevent XSS', () => {
    const html = renderAffiliateLinkHtml({
      label: 'Book a "great" tour <now>',
      url: 'https://example.com/x?a=1&b="<script>',
      provider: 'Klook & Co<img src=x>',
    });
    // Verify escaped forms are present
    expect(html).toContain('&quot;');
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&amp;');
    // Verify raw unescaped < and " are NOT in the rendered HTML
    expect(html).not.toMatch(/href="[^"]*<[^"]*"/);
    expect(html).not.toMatch(/>Book[^<]*<script/i);
  });
});
