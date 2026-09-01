import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/privacy.html', import.meta.url), 'utf-8');

describe('privacy.html', () => {
  it('discloses that no ads, affiliate links, or tracking cookies are used', () => {
    expect(html).toMatch(/doesn't run ads or affiliate links/i);
    expect(html).toMatch(/no advertising or tracking cookies/i);
  });

  it('discloses the contact form and its Formspree processor', () => {
    expect(html).toMatch(/contact form/i);
    expect(html).toMatch(/formspree/i);
  });

  it('provides a contact method', () => {
    expect(html).toMatch(/mailto:/);
  });
});
