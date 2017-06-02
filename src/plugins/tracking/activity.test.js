import { MEMBER_COOKIE } from '../../util/cookieUtils';
import { newSessionId, updateTrackId } from './util/idUtils';
import {
	getTrackApi,
	getTrackLogout,
	getTrackLogin,
	getTrackSession,
} from './_activityTrackers';
// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEMBER_ID = 1234;
const sessionIdCookieName = 'session_foo';
const trackIdCookieName = 'track_bar';
const MEMBER_COOKIE_VALUE = `id=${MEMBER_ID}&name=Boo`;
const cookieOpts = {};

const MOCK_HAPI_RESPONSE = {
	state: (name, value, opts) => {},
	unstate: name => {},
	request: {
		state: {},
		info: { referrer: 'baz' },
		url: { path: 'affogato' },
		query: {},
	},
};

describe('tracking state setters', () => {
	it('sets session id', () => {
		const responseWithoutSessionId = MOCK_HAPI_RESPONSE;
		spyOn(responseWithoutSessionId, 'state');
		const sessionId = newSessionId({ sessionIdCookieName, cookieOpts })(
			responseWithoutSessionId
		);
		expect(UUID_V4_REGEX.test(sessionId)).toBe(true);
		expect(responseWithoutSessionId.state).toHaveBeenCalledWith(
			sessionIdCookieName,
			sessionId,
			jasmine.any(Object)
		);
	});
	it('sets track id if not set', () => {
		const responseWithoutTrackId = MOCK_HAPI_RESPONSE;
		spyOn(responseWithoutTrackId, 'state');
		const trackId = updateTrackId({ trackIdCookieName, cookieOpts })(
			responseWithoutTrackId
		);
		expect(UUID_V4_REGEX.test(trackId)).toBe(true);
		expect(responseWithoutTrackId.state).toHaveBeenCalledWith(
			trackIdCookieName,
			trackId,
			jasmine.any(Object)
		);
	});
	it('does not set track id if already set', () => {
		const trackId = 'foo';
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { [trackIdCookieName]: trackId },
		};
		const responseWithTrackId = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		spyOn(responseWithTrackId, 'state');
		expect(responseWithTrackId.state).not.toHaveBeenCalled();
	});
	it('sets new track id if doRefresh is true', () => {
		const trackId = 'foo';
		const doRefresh = true;
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { [trackIdCookieName]: trackId },
		};
		const responseWithTrackId = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		spyOn(responseWithTrackId, 'state');
		const newTrackId = updateTrackId({ trackIdCookieName, cookieOpts })(
			responseWithTrackId,
			doRefresh
		);
		expect(newTrackId).not.toBe(trackId);
		expect(responseWithTrackId.state).toHaveBeenCalledWith(
			trackIdCookieName,
			newTrackId,
			jasmine.any(Object)
		);
	});
});

describe('tracking loggers', () => {
	const spyable = {
		log: (response, info) => info,
	};
	it('getTrackLogout: calls logger with "logout", new trackId, old sessionId, memberId, trackIdFrom', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[sessionIdCookieName]: 2345,
				[trackIdCookieName]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		getTrackLogout({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(responseWithState);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(spyable.log).toHaveBeenCalled();
		expect(trackInfo.description).toEqual('logout'); // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.trackId).toBeDefined();
		expect(trackInfo.trackId).not.toEqual(request.state[trackIdCookieName]);
		// old
		expect(trackInfo.trackIdFrom).toBeDefined();
		expect(trackInfo.trackIdFrom).toEqual(request.state[trackIdCookieName]);
		expect(trackInfo.sessionId).toEqual(request.state[sessionIdCookieName]);
		expect(trackInfo.memberId).toEqual(MEMBER_ID);
	});
	it('getTrackLogin: calls logger with "login", new memberId & trackId, old sessionId', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[sessionIdCookieName]: 2345,
				[trackIdCookieName]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		const memberId = 1234;

		getTrackLogin({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(responseWithState, memberId);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(spyable.log).toHaveBeenCalled();
		expect(trackInfo.description).toEqual('login'); // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.trackId).toBeDefined();
		expect(trackInfo.trackId).not.toEqual(request.state[trackIdCookieName]);
		expect(trackInfo.memberId).toEqual(memberId);
		// old
		expect(trackInfo.trackIdFrom).toBeDefined();
		expect(trackInfo.trackIdFrom).toEqual(request.state[trackIdCookieName]);
		expect(trackInfo.sessionId).toEqual(request.state[sessionIdCookieName]);
	});
	it('getTrackApi: calls logger with "login" when login in queryResponses', () => {
		spyOn(spyable, 'log').and.callThrough();
		getTrackApi({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(MOCK_HAPI_RESPONSE, [
			{ login: { type: 'login', value: { member: { id: 1234 } } } },
		]);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('login');
	});
	it('getTrackApi: calls logger with "logout" when "logout" in request.query', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			query: { logout: null },
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		getTrackApi({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(responseWithState, [{}]);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('logout');
	});
	it('getTrackSession: calls logger with "session", new sessionId, old trackId & memberId', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[trackIdCookieName]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};

		getTrackSession({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(responseWithState);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('session'); // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.sessionId).toBeDefined();
		expect(trackInfo.sessionId).not.toEqual(request.state[sessionIdCookieName]);
		// old
		expect(trackInfo.trackId).toBeDefined();
		expect(trackInfo.trackId).toEqual(request.state[trackIdCookieName]);
		expect(trackInfo.memberId).toEqual(MEMBER_ID);
	});
	it('getTrackSession: does not call logger when sessionId exists', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[sessionIdCookieName]: 2345,
				[trackIdCookieName]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		getTrackSession({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(responseWithState);
		expect(spyable.log).not.toHaveBeenCalled();
	});
});
