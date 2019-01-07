import Boom from 'boom';
import * as activity from './activity';
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

	const preResponseMethod = activity.getOnPreResponse(mockCookieConfig);

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

describe('getZonedDateTimeStringWithUTCOffset', () => {
	it('returns a zonedDateTime string with the correct format', () => {
		// regex to match format: 2019-01-07T11:03:28.262-05:00
		const re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+-\d{2}:\d{2}$/;
		const zdt = activity.getZonedDateTimeStringWithUTCOffset();
		const matches = zdt.match(re);

		expect(matches).not.toBeNull();
		expect(matches[0]).toEqual(zdt);
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
		const logger = activity.getLogger('MOCK_PLATFORM_AGENT');
		expect(logger(MOCK_REQUEST, { foo: 'bar' })).toMatchSnapshot({
			agent: '',
			foo: 'bar',
			ip: '',
			isUserActivity: true,
			mobileWeb: false,
			platform: 'WEB',
			platformAgent: 'MOCK_PLATFORM_AGENT',
			referer: '',
			requestId: 1234,
			timestamp: expect.any(String),
			trax: expect.any(Object),
		});
	});
	it('sets `platform` to IOS for isNativeApp without Android header', () => {
		const MOCK_REQUEST = {
			headers: {},
			state: { isNativeApp: 'true' },
			id: 1234,
		};
		const platformAgent = 'MOCK_PLATFORM_AGENT';
		const logger = activity.getLogger(platformAgent);
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
		const logger = activity.getLogger(platformAgent);
		const record = logger(MOCK_REQUEST, {});
		expect(record.platform).toBe('IOS');
		expect(record.platformAgent).toBe(platformAgent);
	});
});
