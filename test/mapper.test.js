const test = require('node:test');
const assert = require('node:assert/strict');
const { isGoogleMapsUrl, isShortLink, toAppleMapsUrl } = require('../src/mapper');

const APPLE = 'https://maps.apple.com/';

test('maps a search query', () => {
  // Arrange
  const input = 'https://www.google.com/maps?q=coffee+near+me';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=coffee%20near%20me`);
});

test('maps a query on maps.google.com', () => {
  // Arrange
  const input = 'https://maps.google.com/?q=Eiffel+Tower';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=Eiffel%20Tower`);
});

test('maps a legacy maps.google.com path', () => {
  // Arrange
  const input = 'https://maps.google.com/maps?q=Eiffel+Tower';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=Eiffel%20Tower`);
});

test('maps a place link using the precise data coordinates', () => {
  // Arrange
  const input =
    'https://www.google.com/maps/place/Joe%27s+Pizza/@40.7305,-74.0021,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x1!8m2!3d40.73061!4d-74.00238';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=Joe's%20Pizza&ll=40.73061,-74.00238`);
});

test('maps a place link using the @ center when data coordinates are missing', () => {
  // Arrange
  const input = 'https://www.google.com/maps/place/Central+Park/@40.7829,-73.9654,15z';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=Central%20Park&ll=40.7829,-73.9654`);
});

test('maps a place link whose name is a coordinate pair', () => {
  // Arrange
  const input = 'https://www.google.com/maps/place/40.7128,-74.0060';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=40.7128,-74.0060&ll=40.7128,-74.0060`);
});

test('maps a bare coordinate view with zoom', () => {
  // Arrange
  const input = 'https://www.google.com/maps/@37.7749,-122.4194,14z';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?ll=37.7749,-122.4194&z=14`);
});

test('maps a search path with a center', () => {
  // Arrange
  const input = 'https://www.google.com/maps/search/pizza/@40.7,-74.0,13z';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=pizza&ll=40.7,-74.0&z=13`);
});

test('maps the api=1 search form', () => {
  // Arrange
  const input = 'https://www.google.com/maps/search/?api=1&query=47.5951,-122.3326';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=47.5951,-122.3326&ll=47.5951,-122.3326`);
});

test('maps directions with an origin, destination and driving mode', () => {
  // Arrange
  const input =
    'https://www.google.com/maps/dir/Boston,+MA/New+York,+NY/@41.5,-72.5,8z/data=!4m2!4m1!3e0';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?saddr=Boston,%20MA&daddr=New%20York,%20NY&dirflg=d`);
});

test('maps directions with an empty origin to current location', () => {
  // Arrange
  const input = 'https://www.google.com/maps/dir//1600+Pennsylvania+Ave+NW,+Washington,+DC/';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?daddr=1600%20Pennsylvania%20Ave%20NW,%20Washington,%20DC`);
});

test('maps walking and transit modes', () => {
  // Arrange
  const walking = 'https://www.google.com/maps/dir/A/B/data=!4m2!4m1!3e2';
  const transit = 'https://www.google.com/maps/dir/A/B/data=!4m2!4m1!3e3';
  // Act
  const walk = toAppleMapsUrl(walking);
  const ride = toAppleMapsUrl(transit);
  // Assert
  assert.equal(walk, `${APPLE}?saddr=A&daddr=B&dirflg=w`);
  assert.equal(ride, `${APPLE}?saddr=A&daddr=B&dirflg=r`);
});

test('uses the first and last stop of a multi-stop route', () => {
  // Arrange
  const input = 'https://www.google.com/maps/dir/A/B/C/D/@1,2,10z';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?saddr=A&daddr=D`);
});

test('maps the api=1 directions form', () => {
  // Arrange
  const input =
    'https://www.google.com/maps/dir/?api=1&origin=Space+Needle&destination=Pike+Place+Market&travelmode=walking';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?saddr=Space%20Needle&daddr=Pike%20Place%20Market&dirflg=w`);
});

test('maps legacy saddr and daddr query parameters', () => {
  // Arrange
  const input = 'https://maps.google.com/maps?saddr=Home&daddr=Work&dirflg=r';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?saddr=Home&daddr=Work&dirflg=r`);
});

test('maps a loc: query to coordinates', () => {
  // Arrange
  const input = 'https://maps.google.com/?q=loc:38.9,-77.0';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=38.9,-77.0&ll=38.9,-77.0`);
});

test('uses the maps:// scheme when requested', () => {
  // Arrange
  const input = 'https://www.google.com/maps?q=coffee';
  // Act
  const result = toAppleMapsUrl(input, 'maps');
  // Assert
  assert.equal(result, 'maps://?q=coffee');
});

test('accepts country domains', () => {
  // Arrange
  const input = 'https://www.google.co.uk/maps?q=Big+Ben';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=Big%20Ben`);
});

test('drops an out-of-range zoom', () => {
  // Arrange
  const input = 'https://www.google.com/maps/@37.7,-122.4,30z';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?ll=37.7,-122.4`);
});

test('survives malformed percent encoding', () => {
  // Arrange
  const input = 'https://www.google.com/maps/place/100%+Pure';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, `${APPLE}?q=100%25%20Pure`);
});

test('returns null for unmappable Google Maps URLs', () => {
  // Arrange
  const inputs = [
    'https://www.google.com/maps',
    'https://www.google.com/maps?cid=12345',
    'https://www.google.com/maps/embed?pb=abc',
    'https://www.google.com/maps/d/viewer?mid=abc',
  ];
  // Act
  const results = inputs.map((input) => toAppleMapsUrl(input));
  // Assert
  assert.deepEqual(results, [null, null, null, null]);
});

test('returns null for non-Google-Maps URLs and garbage', () => {
  // Arrange
  const inputs = [
    'https://www.google.com/search?q=maps',
    'https://example.com/maps?q=coffee',
    'https://notgoogle.com/maps?q=coffee',
    'https://google.com.evil.com/maps?q=coffee',
    'not a url',
    'ftp://www.google.com/maps?q=coffee',
    '',
  ];
  // Act
  const results = inputs.map((input) => toAppleMapsUrl(input));
  // Assert
  assert.deepEqual(results, inputs.map(() => null));
});

test('returns null for short links, which need resolving first', () => {
  // Arrange
  const input = 'https://maps.app.goo.gl/AbCdEf123';
  // Act
  const result = toAppleMapsUrl(input);
  // Assert
  assert.equal(result, null);
});

test('detects short links', () => {
  // Arrange
  const short = ['https://maps.app.goo.gl/AbCdEf123', 'https://goo.gl/maps/AbCdEf123'];
  const other = ['https://maps.app.goo.gl/', 'https://goo.gl/other', 'https://www.google.com/maps'];
  // Act
  const shortResults = short.map(isShortLink);
  const otherResults = other.map(isShortLink);
  // Assert
  assert.deepEqual(shortResults, [true, true]);
  assert.deepEqual(otherResults, [false, false, false]);
});

test('detects Google Maps URLs including unmappable and short ones', () => {
  // Arrange
  const yes = [
    'https://www.google.com/maps?cid=1',
    'https://maps.google.com/',
    'https://maps.app.goo.gl/AbCdEf123',
  ];
  const no = ['https://www.google.com/search?q=maps', 'https://example.com/maps'];
  // Act
  const yesResults = yes.map(isGoogleMapsUrl);
  const noResults = no.map(isGoogleMapsUrl);
  // Assert
  assert.deepEqual(yesResults, [true, true, true]);
  assert.deepEqual(noResults, [false, false]);
});
