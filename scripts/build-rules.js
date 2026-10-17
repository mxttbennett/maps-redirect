const fs = require('node:fs');
const path = require('node:path');

const APPLE = 'https://maps.apple.com/';
const STOP = '[^/?#@]+';
const TAIL = '(?:/@[^/?#]*)?(?:/data=[^?#]*)?/?(?:[?#].*)?$';
const GOOGLE = '^https?://(?:www\\.)?google\\.com/maps';
const MODES = [
  { pattern: '!3e2', flag: '&dirflg=w', priority: 3 },
  { pattern: '!3e3', flag: '&dirflg=r', priority: 3 },
  { pattern: '!3e0', flag: '&dirflg=d', priority: 3 },
  { pattern: null, flag: '', priority: 2 },
];
const SEARCH_BASES = [
  `${GOOGLE}(?:/search)?/?`,
  '^https?://maps\\.google\\.com/(?:maps/?)?',
];
const COORDINATE = '-?[0-9.]+(?:,|%2C)-?[0-9.]+';
const SEARCHES = [
  { query: `(?:q|query)=loc(?::|%3A)(${COORDINATE})(?:[&#]|$)`, to: '?q=\\1&ll=\\1', priority: 4 },
  { query: `(?:q|query)=(${COORDINATE})(?:[&#]|$)`, to: '?q=\\1&ll=\\1', priority: 4 },
  { query: '(?:q|query)=([^&#]+)', to: '?q=\\1', priority: 1 },
];

const rules = [];
const add = (regexFilter, substitution, priority) =>
  rules.push({
    id: rules.length + 1,
    priority,
    action: { type: 'redirect', redirect: { regexSubstitution: substitution } },
    condition: { regexFilter, resourceTypes: ['main_frame'] },
  });

for (const mode of MODES) {
  const data = mode.pattern ? `(?:/@[^/?#]*)?/data=[^?#]*${mode.pattern}[^?#]*(?:[?#].*)?$` : TAIL;
  add(`${GOOGLE}/dir/(${STOP})/(${STOP})${data}`, `${APPLE}?saddr=\\1&daddr=\\2${mode.flag}`, mode.priority);
  add(`${GOOGLE}/dir//(${STOP})${data}`, `${APPLE}?daddr=\\1${mode.flag}`, mode.priority);
}
for (const base of SEARCH_BASES) {
  for (const search of SEARCHES) {
    add(`${base}\\?(?:[^#]*&)?${search.query}`, `${APPLE}${search.to}`, search.priority);
  }
}

fs.writeFileSync(
  path.join(__dirname, '..', 'WebExtension', 'rules.json'),
  `${JSON.stringify(rules, null, 2)}\n`
);
