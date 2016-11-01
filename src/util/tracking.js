import uuid from 'node-uuid';

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

/**
 * @method updateSessionId
 *
 * simple tracking id for the browser session
 *
 * @param {Object} hapi response object
 */
export const updateSessionId = response => {
	let sessionId = response.request.state.session_id;

	if (!sessionId) {
		sessionId = uuid.v4();
		response.state(
			'session_id',
			sessionId,
			{
				ttl: null,  // this explicitly a browser session cookie
				encoding: 'none',
				isHttpOnly: true,  // client doesn't need to access this one
				path: '/',
			}
		);
	}
	return sessionId;
};

/**
 * @method updateTrackId
 *
 * Initialize the trackId for member or anonymous user - the longest-living id
 * we can assigned to a user. Stays in place until login or logout, when it is
 * exchanged for a new trackId
 *
 *  - If the user has a tracking cookie already set, do nothing.
 *  - Otherwise, generate a new uuid and set a tracking cookie.
 *
 * @param {Object} hapi response object
 */
export const updateTrackId = (response, doUpdate) => {
	let trackId = response.request.state.track_id;

	if (!trackId || doUpdate) {
		// Generate a new track_id cookie
		trackId = uuid.v4();
		response.state(
			'track_id',
			trackId,
			{
				ttl: YEAR_IN_MS * 20,
				encoding: 'none',
				path: '/',
			}
		);
	}
	return trackId;
};

export const trackLogin = (queryResponses, response) => {
	const loginResponse = queryResponses.find(r => r.type === 'login');
	if (!loginResponse.length) {
		return {};
	}
	return trackingManager('new login', response, {
		newTrackId: true
	});
};

export default function trackingManager(description, response, options={}) {
	const trackInfo = {
		description,
		trackId: updateTrackId(response, options.newTrackId),
		sessionId: updateSessionId(response),
	};
	response.request.log(['tracking'], JSON.stringify(trackInfo, null, 2));
	return trackInfo;
}

