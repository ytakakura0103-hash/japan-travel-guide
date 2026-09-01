import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../site/contact.html', import.meta.url), 'utf-8');

describe('contact.html', () => {
  it('has a form that posts to Formspree', () => {
    expect(html).toMatch(/<form[^>]*action="https:\/\/formspree\.io\/f\/[^"]+"[^>]*method="POST"/i);
  });

  it('collects name, email, and message', () => {
    expect(html).toMatch(/name="name"/);
    expect(html).toMatch(/name="email"/);
    expect(html).toMatch(/name="message"/);
  });

  it('includes a honeypot field for spam filtering', () => {
    expect(html).toMatch(/name="_gotcha"/);
  });

  it('forces the Formspree confirmation page to English', () => {
    expect(html).toMatch(/name="_language"\s+value="en"/);
  });

  it('provides a mailto fallback', () => {
    expect(html).toMatch(/mailto:/);
  });

  it('is linked from the nav on the home page', () => {
    const indexHtml = readFileSync(new URL('../site/index.html', import.meta.url), 'utf-8');
    expect(indexHtml).toContain('href="contact.html"');
  });
});
