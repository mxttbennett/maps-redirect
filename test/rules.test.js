const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../WebExtension/rules.json');
const { toAppleMapsUrl } = require('../src/mapper');

function redirect(url) {
  const matches = rules
    .map((rule) => ({ rule, match: url.match(new RegExp(rule.condition.regexFilter)) }))
    .filter(({ match }) => match)
    .sort((a, b) => b.rule.priority - a.rule.priority);
  if (!matches.length) return null;
  const { rule, match } = matches[0];
  return rule.action.redirect.regexSubstitution.replace(/\\(\d)/g, (_, n) => match[n]);
}

const params = (url) => Object.fromEntries(new URL(url).searchParams);

const COVERED = [
  'https://www.google.com/maps?q=coffee+near+me',
  'https://google.com/maps/search/?api=1&query=pizza',
  'https://maps.google.com/?q=Eiffel+Tower',
  'https://maps.google.com/maps?q=Eiffel+Tower',
  'https://maps.google.com/?q=loc:38.9,-77.0',
  'https://www.google.com/maps?q=38.9,-77.0',
  'https://www.google.com/maps/search/?api=1&query=47.5951,-122.3326',
  'https://www.google.com/maps/dir/Boston,+MA/New+York,+NY/@41.5,-72.5,8z/data=!4m2!4m1!3e0',
  'https://www.google.com/maps/dir/Boston,+MA/New+York,+NY/',
  'https://www.google.com/maps/dir/Boston/NYC/data=!4m2!4m1!3e2',
  'https://www.google.com/maps/dir/A/B/@1,2,10z/data=!4m2!4m1!3e3',
  'https://www.google.com/maps/dir//1600+Pennsylvania+Ave+NW,+Washington,+DC/',
  'https://www.google.com/maps/dir//Pike+Place+Market/@47.6,-122.3,15z/data=!4m2!4m1!3e2',
];

for (const url of COVERED) {
  test(`redirect rules agree with the mapper for ${url}`, () => {
    // Arrange
    const expected = toAppleMapsUrl(url);
    // Act
    const actual = redirect(url);
    // Assert
    assert.ok(actual, 'a rule should match');
    assert.deepEqual(params(actual), params(expected));
  });
}

test('rules leave links the mapper handles alone to the content script', () => {
  // Arrange
  const urls = [
    'https://www.google.com/maps/place/Joe/@40.7,-74.0,17z/data=!3d40.73!4d-74.00',
    'https://www.google.com/maps/dir/A/B/C/@1,2,10z',
    'https://www.google.com/maps/@37.7,-122.4,14z',
    'https://maps.app.goo.gl/AbC123',
    'https://example.com/maps?q=coffee',
  ];
  // Act
  const results = urls.map(redirect);
  // Assert
  assert.deepEqual(results, urls.map(() => null));
});
