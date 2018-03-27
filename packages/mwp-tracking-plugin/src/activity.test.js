import { fakeUTCinTimezone } from './activity';
import { updateId } from './util/idUtils';
// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const trackIdCookieName = 'track_bar';

const MOCK_HAPI_RESPONSE = {
	state: (name, value, opts) => {},
	unstate: name => {},
};
// create new object for each call
const getMockRequest = () => ({
	state: {},
	info: { referrer: 'baz' },
	url: { path: 'affogato' },
	query: {},
	response: MOCK_HAPI_RESPONSE,
	plugins: { tracking: {} },
});

describe('fakeUTCinTimezone', () => {
	const fakeTime = new Date(Date.UTC(2017, 6, 4)); // midnight July 4th in UTC
	it('shifts the time correctly', () => {
		expect(fakeUTCinTimezone('America/New_York')(fakeTime).toISOString()).toBe(
			'2017-07-03T20:00:00.000Z' // 10PM July 3rd in NYC
		);
		expect(fakeUTCinTimezone('Pacific/Auckland')(fakeTime).toISOString()).toBe(
			'2017-07-04T12:00:00.000Z' // noon July 4th in New Zealand
		);
	});
});
describe('updateId', () => {
	it('sets cookiename if not set', () => {
		const requestWithoutTrackId = getMockRequest();
		const trackId = updateId(trackIdCookieName)(requestWithoutTrackId);
		expect(UUID_V4_REGEX.test(trackId)).toBe(true);
		expect(requestWithoutTrackId.plugins.tracking[trackIdCookieName]).toContain(
			trackId
		);
	});
	it('does not set cookiename in plugin data if already set', () => {
		const trackId = 'foo';
		const trackIdCookie = `id=${trackId}`;
		const request = {
			...getMockRequest(),
			state: { [trackIdCookieName]: trackIdCookie },
		};
		const updatedTrackId = updateId(trackIdCookieName)(request);
		expect(updatedTrackId).toBe(trackId); // no change
		expect(request.plugins.tracking[trackIdCookieName]).toBeUndefined();
	});
	it('sets new track id if doRefresh is true', () => {
		const trackId = 'foo';
		const request = {
			...getMockRequest(),
			state: { [trackIdCookieName]: trackId },
		};
		const doRefresh = true;
		const updatedTrackId = updateId(trackIdCookieName)(request, doRefresh);
		expect(updatedTrackId).not.toBe(trackId); // no change
		expect(request.plugins.tracking[trackIdCookieName]).not.toBeUndefined();
		expect(request.plugins.tracking[trackIdCookieName]).toContain(updatedTrackId);
	});
});
