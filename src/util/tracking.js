import uuid from 'node-uuid';

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;
const COOKIE_OPTS = {
	encoding: 'none',
	path: '/',
	isHttpOnly: true,
};


/**
 * @method updateSessionId
 *
 * simple tracking id for the browser session
 *
 * @param {Object} hapi response object
 */
export const updateSessionId = response => {
	let session_id = response.request.state.session_id;

	if (!session_id) {
		session_id = uuid.v4();
		response.state(
			'session_id',
			session_id,
			COOKIE_OPTS
		);
	}
	return session_id;
};

/**
 * getter/setter for member_id cookie: if member_id is not passed, the cookie
 * will be unset
 */
export const updateMemberId = (response, member_id) => {
	if (!member_id) {
		response.unstate('member_id');
		return response.request.state.member_id;
	}
	response.state(
		'member_id',
		member_id,
		{
			...COOKIE_OPTS,
			ttl: YEAR_IN_MS * 20,
		}
	);
	return member_id;
};

/**
 * @method updateTrackId
 *
 * Initialize the track_id for member or anonymous user - the longest-living id
 * we can assigned to a user. Stays in place until login or logout, when it is
 * exchanged for a new track_id
 *
 *  - If the user has a tracking cookie already set, do nothing.
 *  - Otherwise, generate a new uuid and set a tracking cookie.
 *
 * @param {Object} hapi response object
 */
export const updateTrackId = (response, doRefresh) => {
	let track_id = response.request.state.track_id;

	if (!track_id || doRefresh) {
		// Generate a new track_id cookie
		track_id = uuid.v4();
		response.state(
			'track_id',
			track_id,
			{
				...COOKIE_OPTS,
				ttl: YEAR_IN_MS * 20,
			}
		);
	}
	return track_id;
};

export const trackLogout = log => response =>
	log(
		response,
		{
			description: 'logout',
			member_id: updateMemberId(response),
			track_id_from: response.request.state.track_id,
			track_id: updateTrackId(response, true),
			session_id: response.request.state.session_id,
			url: response.request.info.referrer,
		}
	);

export const trackNav = log => (response, queryResponses, url, referrer) => {
	const queries = queryResponses.map(qr => Object.keys(qr)[0]);
	return log(
		response,
		{
			description: 'nav',
			member_id: response.request.state.member_id,
			track_id: response.request.state.track_id,
			session_id: response.request.state.session_id,
			url,
			referrer,
			queries,
		}
	);
};

export const trackApi = log => (response, queryResponses, url, referrer) => {

	trackNav(log)(response, queryResponses, url, referrer);
	// special case - login requests need to be tracked
	const loginResponse = queryResponses.find(r => r.login);
	if (loginResponse) {
		const member_id = JSON.stringify(loginResponse.login.value.member.id);
		trackLogin(log)(response, member_id);
	}
};

export const trackLogin = log => (response, member_id) =>
	log(
		response,
		{
			description: 'login',
			member_id: updateMemberId(response, member_id),
			track_id_from: response.request.state.track_id,
			track_id: updateTrackId(response, true),
			session_id: response.request.state.session_id,
			url: response.request.info.referrer,
		}
	);

export const trackSession = log => response =>
	log(
		response,
		{
			description: 'session',
			member_id: response.request.state.member_id,
			track_id: updateTrackId(response),
			session_id: updateSessionId(response),
			url: response.request.url.path,
		}
	);

export const logTrack = platform_agent => (response, trackInfo) => {
	const requestHeaders = response.request.headers;
	const trackLog = {
		request_id: uuid.v4(),
		ip: requestHeaders['remote-addr'],
		agent: requestHeaders['user-agent'],
		platform: 'meetup-web-platform',
		platform_agent,
		...trackInfo,
	};
	// response.request.log will provide timestaemp
	response.request.log(['tracking'], JSON.stringify(trackLog, null, 2));
	return trackLog;
};

export default function decorateTrack(platform_agent) {
	const log = logTrack(platform_agent);
	const api = trackApi(log);
	const login = trackLogin(log);
	const logout = trackLogout(log);
	const session = trackSession(log);
	const trackers = {
		api,
		login,
		logout,
		session,
	};
	return function(response, trackType, ...args) {
		return trackers[trackType](response, ...args);
	};
}

