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

startRedirector({ resolve: resolveShortLink, pageScheme: 'maps' });
