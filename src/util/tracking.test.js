import {
	newSessionId,
	updateTrackId,
	updateMemberId,
	trackApi,
	trackLogout,
	trackLogin,
	trackSession,
} from './tracking';
// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
		const session_id = newSessionId(responseWithoutSessionId);
		expect(UUID_V4_REGEX.test(session_id)).toBe(true);
		expect(responseWithoutSessionId.state)
			.toHaveBeenCalledWith('session_id', session_id, jasmine.any(Object));
	});
	it('sets track id if not set', () => {
		const responseWithoutTrackId = MOCK_HAPI_RESPONSE;
		spyOn(responseWithoutTrackId, 'state');
		const track_id = updateTrackId(responseWithoutTrackId);
		expect(UUID_V4_REGEX.test(track_id)).toBe(true);
		expect(responseWithoutTrackId.state)
			.toHaveBeenCalledWith('track_id', track_id, jasmine.any(Object));
	});
	it('does not set track id if already set', () => {
		const track_id = 'foo';
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { track_id },
		};
		const responseWithTrackId = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		spyOn(responseWithTrackId, 'state');
		expect(responseWithTrackId.state).not.toHaveBeenCalled();
	});
	it('sets new track id if doRefresh is true', () => {
		const track_id = 'foo';
		const doRefresh = true;
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { track_id },
		};
		const responseWithTrackId = {
			...MOCK_HAPI_RESPONSE,
			request,
		};
		spyOn(responseWithTrackId, 'state');
		const new_track_id = updateTrackId(responseWithTrackId, doRefresh);
		expect(new_track_id).not.toBe(track_id);
		expect(responseWithTrackId.state)
			.toHaveBeenCalledWith('track_id', new_track_id, jasmine.any(Object));
	});
	it('always sets member_id to passed-in value', () => {
		const member_id = 1234;
		spyOn(MOCK_HAPI_RESPONSE, 'state');
		const new_member_id = updateMemberId(MOCK_HAPI_RESPONSE, member_id);
		expect(new_member_id).toBe(member_id);
		expect(MOCK_HAPI_RESPONSE.state)
			.toHaveBeenCalledWith('member_id', member_id, jasmine.any(Object));

	});
	it('overrides request\'s member_id', () => {
		const member_id = 'foo';
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { member_id },
		};
		const responseWithMemberIdRequest = {
			...MOCK_HAPI_RESPONSE,
			request
		};
		spyOn(responseWithMemberIdRequest, 'state');
		const new_member_id = 'bar';
		const returned_member_id = updateMemberId(responseWithMemberIdRequest, new_member_id);
		expect(returned_member_id).toBe(new_member_id);
		expect(responseWithMemberIdRequest.state)
			.toHaveBeenCalledWith('member_id', new_member_id, jasmine.any(Object));
	});
	it('unsets member_id if none passed in', () => {
		spyOn(MOCK_HAPI_RESPONSE, 'unstate');
		spyOn(MOCK_HAPI_RESPONSE, 'state');
		updateMemberId(MOCK_HAPI_RESPONSE);
		expect(MOCK_HAPI_RESPONSE.unstate).toHaveBeenCalledWith('member_id');
		expect(MOCK_HAPI_RESPONSE.state).not.toHaveBeenCalled();
	});
	it('returns request\'s member_id, if present, when un-setting', () => {
		const member_id = 'foo';
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: { member_id },
		};
		const responseWithMemberIdRequest = {
			...MOCK_HAPI_RESPONSE,
			request
		};
		const request_member_id = updateMemberId(responseWithMemberIdRequest);
		expect(request_member_id).toBe(member_id);
		const no_request_member_id = updateMemberId(MOCK_HAPI_RESPONSE);
		expect(no_request_member_id).toBeUndefined();
	});
});

describe('tracking loggers', () => {
	const spyable = {
		log: (response, info) => info,
	};
	it('trackLogout: calls logger with "logout", new track_id, old session_id, member_id, track_id_from', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				member_id: 1234,
				session_id: 2345,
				track_id: 3456,
			},
		};
		const reponseWithState = {
			...MOCK_HAPI_RESPONSE,
			request
		};
		trackLogout(spyable.log)(reponseWithState);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(spyable.log).toHaveBeenCalled();
		expect(trackInfo.description).toEqual('logout');  // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.track_id).toBeDefined();
		expect(trackInfo.track_id).not.toEqual(request.state.track_id);
		// old
		expect(trackInfo.track_id_from).toBeDefined();
		expect(trackInfo.track_id_from).toEqual(request.state.track_id);
		expect(trackInfo.session_id).toEqual(request.state.session_id);
		expect(trackInfo.member_id).toEqual(request.state.member_id);
	});
	it('trackLogin: calls logger with "login", new member_id & track_id, old session_id', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				session_id: 2345,
				track_id: 3456,
			},
		};
		const reponseWithState = {
			...MOCK_HAPI_RESPONSE,
			request
		};
		const member_id = 1234;

		trackLogin(spyable.log)(reponseWithState, member_id);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(spyable.log).toHaveBeenCalled();
		expect(trackInfo.description).toEqual('login');  // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.track_id).toBeDefined();
		expect(trackInfo.track_id).not.toEqual(request.state.track_id);
		expect(trackInfo.member_id).toEqual(member_id);
		// old
		expect(trackInfo.track_id_from).toBeDefined();
		expect(trackInfo.track_id_from).toEqual(request.state.track_id);
		expect(trackInfo.session_id).toEqual(request.state.session_id);
	});
	it('trackApi: calls logger with "login" when login in queryResponses', () => {
		spyOn(spyable, 'log').and.callThrough();
		trackApi(spyable.log)(
			MOCK_HAPI_RESPONSE,
			[{ login: { type: 'login', value: { member: { id: 1234 } } } }]
		);
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
		const reponseWithState = {
			...MOCK_HAPI_RESPONSE,
			request
		};
		trackApi(spyable.log)(
			reponseWithState,
			[{}]
		);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('logout');
	});
	it('trackSession: calls logger with "session", new session_id, old track_id & member_id', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				member_id: 1234,
				track_id: 3456,
			},
		};
		const reponseWithState = {
			...MOCK_HAPI_RESPONSE,
			request
		};

		trackSession(spyable.log)(reponseWithState);
		expect(spyable.log).toHaveBeenCalled();
		const trackInfo = spyable.log.calls.mostRecent().args[1];
		expect(trackInfo.description).toEqual('session');  // this may change, but need to ensure tag is always correct
		// new
		expect(trackInfo.session_id).toBeDefined();
		expect(trackInfo.session_id).not.toEqual(request.state.session_id);
		// old
		expect(trackInfo.track_id).toBeDefined();
		expect(trackInfo.track_id).toEqual(request.state.track_id);
		expect(trackInfo.member_id).toEqual(request.state.member_id);
	});
	it('trackSession: does not call logger when session_id exists', () => {
		spyOn(spyable, 'log').and.callThrough();
		const request = {
			...MOCK_HAPI_RESPONSE.request,
			state: {
				member_id: 1234,
				session_id: 2345,
				track_id: 3456,
			},
		};
		const reponseWithState = {
			...MOCK_HAPI_RESPONSE,
			request
		};
		trackSession(spyable.log)(reponseWithState);
		expect(spyable.log).not.toHaveBeenCalled();
	});
});

