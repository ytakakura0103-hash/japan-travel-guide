export function buildAffiliateLink({ label, url, provider } = {}) {
  if (!label || !url || !provider) {
    throw new Error('buildAffiliateLink requires label, url, and provider');
  }
  return { label, url, provider, disclosureText: 'PR' };
}

export function renderAffiliateLinkHtml(link) {
  const { label, url, provider, disclosureText } = buildAffiliateLink(link);
  return `<a class="affiliate-link" href="${url}" target="_blank" rel="noopener sponsored">${label} (${provider}) <span class="affiliate-disclosure">[${disclosureText}]</span></a>`;
}
