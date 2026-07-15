import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/privacy.html', import.meta.url), 'utf-8');

describe('privacy.html', () => {
  it('discloses the use of cookies and advertising', () => {
    expect(html).toMatch(/cookies/i);
    expect(html).toMatch(/Google AdSense|advertising/i);
  });

  it('discloses the use of affiliate links', () => {
    expect(html).toMatch(/affiliate/i);
  });

  it('provides a contact method', () => {
    expect(html).toMatch(/mailto:/);
  });
});
