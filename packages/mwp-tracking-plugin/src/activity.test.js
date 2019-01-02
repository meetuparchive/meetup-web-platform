import Boom from 'boom';

import { fakeUTCinTimezone, getLogger, getOnPreResponse } from './activity';
import { updateId } from './util/idUtils';

jest.mock('./util/avro', () => ({
	loggers: {
		activity: jest.fn(),
	},
}));

// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const trackIdCookieName = 'track_bar';
const browserIdCookieName = 'browser_foo';
const memberCookieName = 'member_foo';

const MOCK_HAPI_RESPONSE = {
	state: (name, value, opts) => {},
	unstate: name => {},
};

const MOCK_HAPI_TOOLKIT = {
	state: jest.fn(),
};

// create new object for each call
const getMockRequest = (
	mockResponse = MOCK_HAPI_RESPONSE,
	pluginData = {}
) => ({
	state: {},
	info: { referrer: 'baz' },
	url: { path: 'affogato' },
	query: {},
	response: mockResponse,
	plugins: { tracking: pluginData },
});

const mockCookieConfig = {
	browserIdCookieName,
	memberCookieName,
	trackIdCookieName,
	domain: '.meetup.com',
};

describe('getOnPreResponse', () => {
	const browserId = 'browserFoo';
	const trackId = 'trackBar';

	const pluginData = {
		[browserIdCookieName]: browserId,
		[trackIdCookieName]: trackId,
	};

	const requestState = {
		[trackIdCookieName]: `id=${trackId}`,
		[browserIdCookieName]: `id=${browserId}`,
	};

	const preResponseMethod = getOnPreResponse(mockCookieConfig);

	it('does not set cookies when response contains an error', () => {
		const errorRequest = {
			...getMockRequest(new Boom('error'), pluginData),
			state: requestState,
		};

		preResponseMethod(errorRequest, MOCK_HAPI_TOOLKIT);

		expect(MOCK_HAPI_TOOLKIT.state).not.toHaveBeenCalled();
		MOCK_HAPI_TOOLKIT.state.mockClear();
	});

	it('sets cookies when response is valid', () => {
		const request = {
			...getMockRequest(MOCK_HAPI_RESPONSE, pluginData),
			state: requestState,
		};

		preResponseMethod(request, MOCK_HAPI_TOOLKIT);

		expect(MOCK_HAPI_TOOLKIT.state).toHaveBeenCalledTimes(2);
		MOCK_HAPI_TOOLKIT.state.mockClear();
	});
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
		expect(request.plugins.tracking[trackIdCookieName]).toContain(
			updatedTrackId
		);
	});
});
describe('getLogger', () => {
	it('returns expected record shape', () => {
		const MOCK_REQUEST = {
			headers: {},
			state: {},
			id: 1234,
		};
		jest
			.spyOn(Date.prototype, 'toISOString')
			.mockImplementation(() => 'mock ISO date');
		const logger = getLogger('MOCK_PLATFORM_AGENT');
		expect(logger(MOCK_REQUEST, { foo: 'bar' })).toMatchInlineSnapshot(`
Object {
  "agent": "",
  "foo": "bar",
  "ip": "",
  "isUserActivity": true,
  "mobileWeb": false,
  "platform": "WEB",
  "platformAgent": "MOCK_PLATFORM_AGENT",
  "referer": "",
  "requestId": 1234,
  "timestamp": "mock ISO date",
  "trax": Object {},
}
`);
		jest.restoreAllMocks(); // restore toISOString behavior
	});
	it('sets `platform` to IOS for isNativeApp without Android header', () => {
		const MOCK_REQUEST = {
			headers: {},
			state: { isNativeApp: 'true' },
			id: 1234,
		};
		const platformAgent = 'MOCK_PLATFORM_AGENT';
		const logger = getLogger(platformAgent);
		const record = logger(MOCK_REQUEST, {});
		expect(record.platform).toBe('IOS');
		expect(record.platformAgent).toBe(platformAgent);
	});
	it('sets `platform` to ANDROID for isNativeApp with Android header', () => {
		const MOCK_REQUEST = {
			headers: {},
			state: { isNativeApp: 'true' },
			id: 1234,
		};
		const platformAgent = 'MOCK_PLATFORM_AGENT';
		const logger = getLogger(platformAgent);
		const record = logger(MOCK_REQUEST, {});
		expect(record.platform).toBe('IOS');
		expect(record.platformAgent).toBe(platformAgent);
	});
});
