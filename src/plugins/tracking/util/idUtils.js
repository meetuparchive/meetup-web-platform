import uuid from 'uuid';

const YEAR_IN_MS: number = 1000 * 60 * 60 * 24 * 365;

type UpdateTrackIdOpts = {
	trackIdCookieName: string,
	cookieOpts: CookieOpts,
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
export const updateTrackId: UpdateTrackId = (options: {
	trackIdCookieName: string,
	cookieOpts: CookieOpts,
}) => (response: Object, doRefresh: ?boolean) => {
	const { trackIdCookieName, cookieOpts } = options;
	let trackId: string = response.request.state[trackIdCookieName];

	if (!trackId || doRefresh) {
		// Generate a new trackId cookie
		trackId = uuid.v4();
		response.state(trackIdCookieName, trackId, {
			...cookieOpts,
			ttl: YEAR_IN_MS * 20,
		});
	}
	return trackId;
};

/*
 * This function creates a new browser session id and stores it in a cookie that
 * will be shared across browser tabs
 */
export const newSessionId: ({
	sessionIdCookieName: string,
	cookieOpts: CookieOpts,
}) => Object => string = options => response => {
	const { sessionIdCookieName, cookieOpts } = options;
	const sessionId: string = uuid.v4();
	response.state(sessionIdCookieName, sessionId, cookieOpts);
	return sessionId;
};
