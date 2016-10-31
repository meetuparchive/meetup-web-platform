import uuid from 'node-uuid';

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

/**
 * @method setSessionId
 *
 * simple tracking id for the browser session
 *
 * @param {Object} hapi request object
 * @param {Object} hapi response object
 */
export const setSessionId = (request, response) => {
	const sessionId = uuid.v4();
	response.state(
		'session_id',
		sessionId,
		{ encoding: 'none' }
	);
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
 * @param {Object} hapi request object
 * @param {Object} hapi response object
 */
export const updateTrackId = (request, response) => {
	let trackId = request.state.track_id;

	if (!trackId) {
		// Generate a new track_id cookie
		trackId = uuid.v4();
		response.state(
			'track_id',
			trackId,
			{
				ttl: YEAR_IN_MS * 20,
				encoding: 'none'
			}
		);
	}
	return trackId;
};

