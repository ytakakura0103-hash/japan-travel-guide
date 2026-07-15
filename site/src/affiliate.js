function escapeHtml(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAffiliateLink({ label, url, provider } = {}) {
  if (!label || !url || !provider) {
    throw new Error('buildAffiliateLink requires label, url, and provider');
  }
  return { label, url, provider, disclosureText: 'PR' };
}

export function renderAffiliateLinkHtml(link) {
  const { label, url, provider, disclosureText } = buildAffiliateLink(link);
  const escapedLabel = escapeHtml(label);
  const escapedUrl = escapeHtml(url);
  const escapedProvider = escapeHtml(provider);
  return `<a class="affiliate-link" href="${escapedUrl}" target="_blank" rel="noopener sponsored">${escapedLabel} (${escapedProvider}) <span class="affiliate-disclosure">[${disclosureText}]</span></a>`;
}
