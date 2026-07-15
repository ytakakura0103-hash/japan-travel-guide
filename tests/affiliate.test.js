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
});
