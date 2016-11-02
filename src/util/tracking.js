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

export const trackLogout = response =>
	logTrack(
		response,
		{
			description: 'logout',
			member_id: updateMemberId(response),
			track_id_from: response.request.state.track_id,
			track_id: updateTrackId(response, true),
			session_id: response.request.state.session_id,
		}
	);

export const trackLogin = (response, member_id) =>
	logTrack(
		response,
		{
			description: 'login',
			member_id: updateMemberId(response, member_id),
			track_id_from: response.request.state.track_id,
			track_id: updateTrackId(response, true),
			session_id: response.request.state.session_id,
		}
	);

export const trackSession = response =>
	logTrack(
		response,
		{
			description: 'new session',
			member_id: response.request.state.member_id,
			track_id: updateTrackId(response),
			session_id: updateSessionId(response),
		}
	);

export function logTrack(response, trackInfo) {
	const requestHeaders = response.request.headers;
	const trackLog = {
		...trackInfo,
		request_id: uuid.v4(),
		url: requestHeaders.referer,
		referrer: 'this will be handled in a special way for navigation actions',
		ip: requestHeaders['remote-addr'],
		agent: requestHeaders['user-agent'],
		platform: 'something something',
		platform_agent: 'something something',
	};
	// response.request.log will provide timestaemp
	response.request.log(['tracking'], JSON.stringify(trackLog, null, 2));
	return trackInfo;
}

