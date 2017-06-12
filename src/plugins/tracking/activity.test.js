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

describe('tracking state setters', () => {
	it('sets session id', () => {
		const requestWithoutSessionId = getMockRequest();
		const sessionId = newSessionId(requestWithoutSessionId);
		expect(requestWithoutSessionId.plugins.tracking.sessionId).toBe(sessionId);
		expect(UUID_V4_REGEX.test(sessionId)).toBe(true);
	});
	it('sets track id if not set', () => {
		const requestWithoutTrackId = getMockRequest();
		const trackId = updateTrackId({ trackIdCookieName })(requestWithoutTrackId);
		expect(UUID_V4_REGEX.test(trackId)).toBe(true);
		expect(requestWithoutTrackId.plugins.tracking.trackId).toBe(trackId);
	});
	it('does not set trackId in plugin data if already set', () => {
		const trackId = 'foo';
		const request = {
			...getMockRequest(),
			state: { [trackIdCookieName]: trackId },
		};
		const updatedTrackId = updateTrackId({ trackIdCookieName })(request);
		expect(updatedTrackId).toBe(trackId); // no change
		expect(request.plugins.tracking.trackId).toBeUndefined();
	});
	it('sets new track id if doRefresh is true', () => {
		const trackId = 'foo';
		const request = {
			...getMockRequest(),
			state: { [trackIdCookieName]: trackId },
		};
		const doRefresh = true;
		const updatedTrackId = updateTrackId({ trackIdCookieName })(
			request,
			doRefresh
		);
		expect(updatedTrackId).not.toBe(trackId); // no change
		expect(request.plugins.tracking.trackId).not.toBeUndefined();
		expect(request.plugins.tracking.trackId).toBe(updatedTrackId);
	});
});

describe('tracking loggers', () => {
	const spyable = {
		log: (response, info) => info,
	};
	it('getTrackLogout: calls logger with "logout", new trackId, old sessionId, memberId, trackIdFrom', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...getMockRequest(),
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[sessionIdCookieName]: 2345,
				[trackIdCookieName]: 3456,
			},
		};
		getTrackLogout({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(request);
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
			...getMockRequest(),
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[sessionIdCookieName]: 2345,
				[trackIdCookieName]: 3456,
			},
		};
		const memberId = 1234;

		getTrackLogin({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(request, memberId);
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
	// skipping this test for now - need to remove all login/logout tracking until
	// it can be rebuilt properly
	xit(
		'getTrackApi: calls logger with "login" when login in queryResponses',
		() => {
			spyOn(spyable, 'log').and.callThrough();
			getTrackApi({
				log: spyable.log,
				trackIdCookieName,
				sessionIdCookieName,
				cookieOpts,
			})(getMockRequest(), [
				{ login: { type: 'login', value: { member: { id: 1234 } } } },
			]);
			expect(spyable.log).toHaveBeenCalled();
			const trackInfo = spyable.log.calls.mostRecent().args[1];
			expect(trackInfo.description).toEqual('login');
		}
	);
	// skipping this test for now - need to remove all login/logout tracking until
	// it can be rebuilt properly
	xit(
		'getTrackApi: calls logger with "logout" when "logout" in request.query',
		() => {
			spyOn(spyable, 'log').and.callThrough();
			const request = {
				...getMockRequest(),
				query: { logout: null },
			};
			getTrackApi({
				log: spyable.log,
				trackIdCookieName,
				sessionIdCookieName,
				cookieOpts,
			})(request, [{}]);
			expect(spyable.log).toHaveBeenCalled();
			const trackInfo = spyable.log.calls.mostRecent().args[1];
			expect(trackInfo.description).toEqual('logout');
		}
	);
	it('getTrackSession: calls logger with "session", new sessionId, old trackId & memberId', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...getMockRequest(),
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[trackIdCookieName]: 3456,
			},
		};
		getTrackSession({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(request);
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
			...getMockRequest(),
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[sessionIdCookieName]: 2345,
				[trackIdCookieName]: 3456,
			},
		};
		getTrackSession({
			log: spyable.log,
			trackIdCookieName,
			sessionIdCookieName,
			cookieOpts,
		})(request);
		expect(spyable.log).not.toHaveBeenCalled();
	});
});
