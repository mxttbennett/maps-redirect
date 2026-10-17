// ==UserScript==
// @name         Google Maps to Apple Maps
// @namespace    https://github.com/mxttbennett/maps-redirect
// @version      1.0.0
// @description  Opens Google Maps links in Apple Maps
// @downloadURL  https://raw.githubusercontent.com/mxttbennett/maps-redirect/main/dist/maps-redirect.user.js
// @updateURL    https://raw.githubusercontent.com/mxttbennett/maps-redirect/main/dist/maps-redirect.user.js
// @match        *://*/*
// @noframes
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      maps.app.goo.gl
// @connect      goo.gl
// @connect      google.com
// @connect      www.google.com
// ==/UserScript==

(function () {
'use strict';
const GOOGLE_HOST = /^(www\.)?google\.(com|[a-z]{2}|(co|com)\.[a-z]{2})$/;
const MAPS_HOST = /^maps\.google\.(com|[a-z]{2}|(co|com)\.[a-z]{2})$/;
const NUMBER = '-?\\d+(?:\\.\\d+)?';
const COORD = new RegExp(`^(${NUMBER}),\\s*(${NUMBER})$`);
const AT_CENTER = new RegExp(`^@(${NUMBER}),(${NUMBER})(?:,([\\d.]+)z)?`);
const DATA_COORD = new RegExp(`!3d(${NUMBER})!4d(${NUMBER})`);
const DATA_MODE = { 0: 'd', 2: 'w', 3: 'r' };
const API_MODE = { driving: 'd', walking: 'w', transit: 'r' };

function parseUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function decode(segment) {
  const spaced = segment.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(spaced);
  } catch {
    return spaced;
  }
}

function isShortLink(input) {
  const url = parseUrl(input);
  if (!url) return false;
  if (url.hostname === 'maps.app.goo.gl') return url.pathname.length > 1;
  return url.hostname === 'goo.gl' && /^\/maps\/.+/.test(url.pathname);
}

function mapsPath(url) {
  if (MAPS_HOST.test(url.hostname)) {
    if (url.pathname.startsWith('/maps')) return url.pathname.slice(5);
    return url.pathname === '/' ? '' : url.pathname;
  }
  if (GOOGLE_HOST.test(url.hostname)) {
    const match = url.pathname.match(/^\/maps(\/.*)?$/);
    return match ? match[1] || '' : null;
  }
  return null;
}

function isGoogleMapsUrl(input) {
  const url = parseUrl(input);
  return Boolean(url) && (mapsPath(url) !== null || isShortLink(input));
}

function atCenter(segments) {
  for (const segment of segments) {
    const match = segment.match(AT_CENTER);
    if (match) return { ll: `${match[1]},${match[2]}`, z: match[3] };
  }
  return {};
}

function zoom(value) {
  const level = Math.round(Number(value));
  return level >= 2 && level <= 21 ? level : undefined;
}

function dataCoords(path) {
  const match = path.match(DATA_COORD);
  return match ? `${match[1]},${match[2]}` : undefined;
}

function directionsParams(rest, path) {
  const stops = [];
  for (const segment of rest) {
    if (segment.startsWith('@') || segment.startsWith('data=')) break;
    stops.push(decode(segment));
  }
  while (stops.length && stops[stops.length - 1] === '') stops.pop();
  if (!stops.length) return null;
  const mode = path.match(/!3e(\d)/);
  return {
    saddr: stops.length > 1 ? stops[0] : undefined,
    daddr: stops[stops.length - 1],
    dirflg: mode ? DATA_MODE[mode[1]] : undefined,
  };
}

function placeParams(rest, path) {
  const first = rest[0] || '';
  const name = first.startsWith('@') || first.startsWith('data=') ? '' : decode(first);
  const ll = COORD.test(name) ? name : dataCoords(path) || atCenter(rest).ll;
  if (!name && !ll) return null;
  return { q: name || ll, ll };
}

function searchPathParams(rest) {
  const first = rest[0] || '';
  const { ll, z } = atCenter(rest);
  if (first && !first.startsWith('@')) return { q: decode(first), ll, z: zoom(z) };
  return ll ? { ll, z: zoom(z) } : null;
}

function viewParams(segments) {
  const { ll, z } = atCenter(segments);
  return ll ? { ll, z: zoom(z) } : null;
}

function queryParams(search) {
  const daddr = search.get('daddr') || search.get('destination');
  if (daddr) {
    const flag = search.get('dirflg');
    return {
      saddr: search.get('saddr') || search.get('origin') || undefined,
      daddr,
      dirflg: API_MODE[search.get('travelmode')] || (/^[dwr]$/.test(flag) ? flag : undefined),
    };
  }
  const center = search.get('ll') || search.get('center');
  const ll = COORD.test(center || '') ? center : undefined;
  const query = search.get('q') || search.get('query');
  if (query) {
    const located = query.match(/^loc:(.+)$/);
    const text = located ? located[1] : query;
    return { q: text, ll: ll || (COORD.test(text) ? text : undefined), z: zoom(search.get('z')) };
  }
  return ll ? { ll, z: zoom(search.get('z')) } : null;
}

function pathParams(segments, path) {
  const [kind = '', ...rest] = segments;
  if (kind === 'dir') return directionsParams(rest, path);
  if (kind === 'place') return placeParams(rest, path);
  if (kind === 'search') return searchPathParams(rest);
  if (kind.startsWith('@')) return viewParams(segments);
  return null;
}

function appleUrl(params, scheme) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%2C/g, ',')}`)
    .join('&');
  return scheme === 'maps' ? `maps://?${query}` : `https://maps.apple.com/?${query}`;
}

function toAppleMapsUrl(input, scheme = 'https') {
  const url = parseUrl(input);
  const path = url && mapsPath(url);
  if (path === null || path === undefined) return null;
  const segments = path.split('/').slice(1);
  const params = pathParams(segments, url.pathname) || queryParams(url.searchParams);
  return params ? appleUrl(params, scheme) : null;
}

if (typeof module !== 'undefined') {
  module.exports = { isGoogleMapsUrl, isShortLink, toAppleMapsUrl };
}

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

})();
