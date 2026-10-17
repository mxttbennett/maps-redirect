function startRedirector({ resolve, pageScheme }) {
  async function open(href) {
    const resolved = isShortLink(href) ? await resolve(href) : href;
    const target = resolved && toAppleMapsUrl(resolved, pageScheme);
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
        open(anchor.href);
      },
      true
    );
    new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(rewriteTree));
    }).observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', () => rewriteTree(document.documentElement));
  }

  if (isShortLink(location.href)) {
    open(location.href);
    return;
  }
  const target = toAppleMapsUrl(location.href, pageScheme);
  if (target) {
    location.replace(target);
    return;
  }
  if (!isGoogleMapsUrl(location.href)) watchLinks();
}
