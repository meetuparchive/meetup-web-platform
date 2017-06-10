// @flow
import uuid from 'uuid';

type UpdateTrackIdOpts = {
	trackIdCookieName: string,
};
type UpdateTrackId = UpdateTrackIdOpts => (Object, ?boolean) => string;
/*
 * Initialize the trackId for member or anonymous user - the longest-living id
 * we can assign to a user. Stays in place until login or logout, when it is
 * exchanged for a new trackId
 *
 *  - If the user has a tracking cookie already set, do nothing.
 *  - Otherwise, generate a new uuid and set a tracking cookie.
 */
export const updateTrackId: UpdateTrackId = (options: TrackOpts) => (
	request: Object,
	doRefresh: ?boolean
) => {
	const { trackIdCookieName } = options;
	let trackId: string = request.state[trackIdCookieName];

	if (!trackId || doRefresh) {
		// Generate a new trackId cookie
		trackId = uuid.v4();
		request.plugins.tracking.trackId = trackId;
	}
	return trackId;
};

/*
 * This function creates a new browser session id and stores it in a cookie that
 * will be shared across browser tabs
 */
export const newSessionId: Object => string = request => {
	const sessionId: string = uuid.v4();
	request.plugins.tracking.sessionId = sessionId;
	return sessionId;
};
