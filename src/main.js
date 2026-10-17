function resolveShortLink(href) {
  return new Promise((resolve) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: href,
      onload: (response) => resolve(response.finalUrl || response.responseURL || null),
      onerror: () => resolve(null),
      ontimeout: () => resolve(null),
      timeout: 8000,
    });
  });
}

async function openInAppleMaps(href) {
  const resolved = isShortLink(href) ? await resolveShortLink(href) : href;
  const target = resolved && toAppleMapsUrl(resolved, 'maps');
  window.location.assign(target || href);
}

function rewriteAnchor(anchor) {
  const mapped = toAppleMapsUrl(anchor.href);
  if (mapped) anchor.href = mapped;
}

function rewriteTree(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.matches('a[href]')) rewriteAnchor(node);
  node.querySelectorAll('a[href]').forEach(rewriteAnchor);
}

function watchLinks() {
  document.addEventListener(
    'click',
    (event) => {
      const anchor = event.target.closest && event.target.closest('a[href]');
      if (!anchor || !isShortLink(anchor.href)) return;
      event.preventDefault();
      event.stopPropagation();
      openInAppleMaps(anchor.href);
    },
    true
  );
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(rewriteTree));
  }).observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => rewriteTree(document.documentElement));
}

function main() {
  if (isShortLink(location.href)) {
    openInAppleMaps(location.href);
    return;
  }
  const target = toAppleMapsUrl(location.href, 'maps');
  if (target) {
    location.replace(target);
    return;
  }
  if (!isGoogleMapsUrl(location.href)) watchLinks();
}

main();
