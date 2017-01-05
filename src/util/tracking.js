import uuid from 'uuid';

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;
const COOKIE_OPTS = {
	encoding: 'none',
	path: '/',
	isHttpOnly: true,
	isSecure: process.env.NODE_ENV === 'production',
};


/**
 * @method newSessionId
 *
 * simple tracking id for the browser session
 *
 * @param {Object} hapi response object
 */
export const newSessionId = response => {
	const sessionId = uuid.v4();
	response.state(
		'session_id',
		sessionId,
		COOKIE_OPTS
	);
	return sessionId;
};

/**
 * getter/setter for memberId cookie: if memberId is not passed, the cookie
 * will be unset
 */
export const updateMemberId = (response, memberId) => {
	if (!memberId) {
		response.unstate('memberId');
		return response.request.state.memberId;
	}
	response.state(
		'memberId',
		memberId,
		{
			...COOKIE_OPTS,
			ttl: YEAR_IN_MS * 20,
		}
	);
	return memberId;
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
	let trackId = response.request.state.track_id;

	if (!trackId || doRefresh) {
		// Generate a new track_id cookie
		trackId = uuid.v4();
		response.state(
			'track_id',
			trackId,
			{
				...COOKIE_OPTS,
				ttl: YEAR_IN_MS * 20,
			}
		);
	}
	return trackId;
};

export const trackLogout = log => response =>
	log(
		response,
		{
			description: 'logout',
			memberId: updateMemberId(response),
			trackIdFrom: response.request.state.track_id,
			trackId: updateTrackId(response, true),
			sessionId: response.request.state.session_id,
			url: response.request.info.referrer,
		}
	);

export const trackNav = log => (response, queryResponses, url, referrer) => {
	const apiRequests = queryResponses.map(qr => {
		const ref = Object.keys(qr)[0];
		const { meta } = { ...qr[ref] };
		return {
			requestId: meta.requestId,
			endpoint: meta.endpoint,
		};
	});
	return log(
		response,
		{
			description: 'nav',
			memberId: response.request.state.member_id,
			trackId: response.request.state.track_id,
			sessionId: response.request.state.session_id,
			url,
			referrer,
			apiRequests,
		}
	);
};

export const trackApi = log => (response, queryResponses, metadata={}) => {
	const {
		url,
		referrer,
		method,
	} = metadata;
	if (method === 'get') {
		return trackNav(log)(response, queryResponses, url, referrer);
	}
	// special case - login requests need to be tracked
	const loginResponse = queryResponses.find(r => r.login);
	if ((loginResponse && loginResponse.login.value || {}).member) {
		const memberId = JSON.stringify(loginResponse.login.value.member.id);
		trackLogin(log)(response, memberId);
	}
	if ('logout' in response.request.query) {
		trackLogout(log)(response);
	}
};

export const trackLogin = log => (response, memberId) =>
	log(
		response,
		{
			description: 'login',
			memberId: updateMemberId(response, memberId),
			trackIdFrom: response.request.state.track_id,
			trackId: updateTrackId(response, true),
			sessionId: response.request.state.session_id,
			url: response.request.info.referrer,
		}
	);

export const trackSession = log => response => {
	if (response.request.state.session_id) {
		// if there's already a session id, there's nothing to track
		return null;
	}
	return log(
		response,
		{
			description: 'session',
			memberId: response.request.state.member_id,
			trackId: updateTrackId(response),
			sessionId: newSessionId(response),
			url: response.request.url.path,
		}
	);
};

export const logTrack = platformAgent => (response, trackInfo) => {
	const requestHeaders = response.request.headers;
	const trackLog = {
		timestamp: new Date().getTime(),
		requestId: uuid.v4(),
		ip: requestHeaders['remote-addr'],
		agent: requestHeaders['user-agent'],
		platform: 'meetup-web-platform',
		platformAgent,
		...trackInfo,
	};
	// response.request.log will provide timestaemp
	response.request.log(['tracking'], JSON.stringify(trackLog, null, 2));
	return trackLog;
};

export default function decorateTrack(platformAgent) {
	const log = logTrack(platformAgent);
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

