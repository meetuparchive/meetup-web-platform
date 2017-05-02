import { MEMBER_COOKIE } from './cookieUtils';
import {
	SESSION_ID_COOKIE,
	TRACK_ID_COOKIE,
	newSessionId,
	updateTrackId,
	trackApi,
	trackLogout,
	trackLogin,
	trackSession,
} from './tracking';
// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEMBER_ID = 1234;
const MEMBER_COOKIE_VALUE = `id=${MEMBER_ID}&name=Boo`;

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
		const sessionId = newSessionId(responseWithoutSessionId);
		expect(UUID_V4_REGEX.test(sessionId)).toBe(true);
		expect(responseWithoutSessionId.state).toHaveBeenCalledWith(
			SESSION_ID_COOKIE,
			sessionId,
			jasmine.any(Object)
		);
	});
	it('sets track id if not set', () => {
		const responseWithoutTrackId = MOCK_HAPI_RESPONSE;
		spyOn(responseWithoutTrackId, 'state');
		const trackId = updateTrackId(responseWithoutTrackId);
		expect(UUID_V4_REGEX.test(trackId)).toBe(true);
		expect(responseWithoutTrackId.state).toHaveBeenCalledWith(
			TRACK_ID_COOKIE,
			trackId,
			jasmine.any(Object)
		);
	});
	it('does not set track id if already set', () => {
		const trackId = 'foo';
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { [TRACK_ID_COOKIE]: trackId },
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
			state: { [TRACK_ID_COOKIE]: trackId },
		};
		const responseWithTrackId = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		spyOn(responseWithTrackId, 'state');
		const newTrackId = updateTrackId(responseWithTrackId, doRefresh);
		expect(newTrackId).not.toBe(trackId);
		expect(responseWithTrackId.state).toHaveBeenCalledWith(
			TRACK_ID_COOKIE,
			newTrackId,
			jasmine.any(Object)
		);
	});
});

describe('tracking loggers', () => {
	const spyable = {
		log: (response, info) => info,
	};
	it('trackLogout: calls logger with "logout", new trackId, old sessionId, memberId, trackIdFrom', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[SESSION_ID_COOKIE]: 2345,
				[TRACK_ID_COOKIE]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		trackLogout(spyable.log)(responseWithState);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(spyable.log).toHaveBeenCalled();
		expect(trackInfo.description).toEqual('logout'); // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.trackId).toBeDefined();
		expect(trackInfo.trackId).not.toEqual(request.state[TRACK_ID_COOKIE]);
		// old
		expect(trackInfo.trackIdFrom).toBeDefined();
		expect(trackInfo.trackIdFrom).toEqual(request.state[TRACK_ID_COOKIE]);
		expect(trackInfo.sessionId).toEqual(request.state[SESSION_ID_COOKIE]);
		expect(trackInfo.memberId).toEqual(MEMBER_ID);
	});
	it('trackLogin: calls logger with "login", new memberId & trackId, old sessionId', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[SESSION_ID_COOKIE]: 2345,
				[TRACK_ID_COOKIE]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		const memberId = 1234;

		trackLogin(spyable.log)(responseWithState, memberId);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(spyable.log).toHaveBeenCalled();
		expect(trackInfo.description).toEqual('login'); // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.trackId).toBeDefined();
		expect(trackInfo.trackId).not.toEqual(request.state[TRACK_ID_COOKIE]);
		expect(trackInfo.memberId).toEqual(memberId);
		// old
		expect(trackInfo.trackIdFrom).toBeDefined();
		expect(trackInfo.trackIdFrom).toEqual(request.state[TRACK_ID_COOKIE]);
		expect(trackInfo.sessionId).toEqual(request.state[SESSION_ID_COOKIE]);
	});
	it('trackApi: calls logger with "login" when login in queryResponses', () => {
		spyOn(spyable, 'log').and.callThrough();
		trackApi(spyable.log)(MOCK_HAPI_RESPONSE, [
			{ login: { type: 'login', value: { member: { id: 1234 } } } },
		]);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('login');
	});
	it('trackApi: calls logger with "logout" when "logout" in request.query', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			query: { logout: null },
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		trackApi(spyable.log)(responseWithState, [{}]);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('logout');
	});
	it('trackSession: calls logger with "session", new sessionId, old trackId & memberId', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[TRACK_ID_COOKIE]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};

		trackSession(spyable.log)(responseWithState);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('session'); // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.sessionId).toBeDefined();
		expect(trackInfo.sessionId).not.toEqual(request.state[SESSION_ID_COOKIE]);
		// old
		expect(trackInfo.trackId).toBeDefined();
		expect(trackInfo.trackId).toEqual(request.state[TRACK_ID_COOKIE]);
		expect(trackInfo.memberId).toEqual(MEMBER_ID);
	});
	it('trackSession: does not call logger when sessionId exists', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				[MEMBER_COOKIE]: MEMBER_COOKIE_VALUE,
				[SESSION_ID_COOKIE]: 2345,
				[TRACK_ID_COOKIE]: 3456,
			},
		};
		const responseWithState = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		trackSession(spyable.log)(responseWithState);
		expect(spyable.log).not.toHaveBeenCalled();
	});
});
