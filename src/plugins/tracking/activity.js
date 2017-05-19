// @flow weak
import uuid from 'uuid';
import avro from './avro';
import { parseMemberCookie } from '../../util/cookieUtils';

const YEAR_IN_MS: number = 1000 * 60 * 60 * 24 * 365;
type Log = (response: Object, ...args: Array<any>) => mixed;
type TrackOpts = {
	log: Log,
	TRACK_ID_COOKIE: string,
	SESSION_ID_COOKIE: string,
	COOKIE_OPTS: CookieOpts,
};
type Tracker = TrackOpts => Log;
/**
 * @method newSessionId
 *
 * simple tracking id for the browser session
 *
 * @param {Object} hapi response object
 */
export const newSessionId: ({
	SESSION_ID_COOKIE: string,
	COOKIE_OPTS: CookieOpts,
}) => Object => string = options => response => {
	const { SESSION_ID_COOKIE, COOKIE_OPTS } = options;
	const sessionId: string = uuid.v4();
	response.state(SESSION_ID_COOKIE, sessionId, COOKIE_OPTS);
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
type UpdateTrackId = ({
	TRACK_ID_COOKIE: string,
	COOKIE_OPTS: CookieOpts,
}) => (Object, ?boolean) => string;

export const updateTrackId: UpdateTrackId = (options: {
	TRACK_ID_COOKIE: string,
	COOKIE_OPTS: CookieOpts,
}) => (response: Object, doRefresh: ?boolean) => {
	const { TRACK_ID_COOKIE, COOKIE_OPTS } = options;
	let trackId: string = response.request.state[TRACK_ID_COOKIE];

	if (!trackId || doRefresh) {
		// Generate a new trackId cookie
		trackId = uuid.v4();
		response.state(TRACK_ID_COOKIE, trackId, {
			...COOKIE_OPTS,
			ttl: YEAR_IN_MS * 20,
		});
	}
	return trackId;
};

export const trackLogout: Tracker = ({
	log,
	TRACK_ID_COOKIE,
	SESSION_ID_COOKIE,
	COOKIE_OPTS,
}: TrackOpts) => (response: Object) =>
	log(response, {
		description: 'logout',
		memberId: parseMemberCookie(response.request.state).id,
		trackIdFrom: response.request.state[TRACK_ID_COOKIE] || '',
		trackId: updateTrackId({ TRACK_ID_COOKIE, COOKIE_OPTS })(
			response,
			true
		),
		sessionId: response.request.state[SESSION_ID_COOKIE],
		url: response.request.info.referrer || '',
	});

export const trackNav: Tracker = ({
	log,
	TRACK_ID_COOKIE,
	SESSION_ID_COOKIE,
}: TrackOpts) => (
	response: Object,
	queryResponses: Array<Object>,
	url: string,
	referrer: string
) => {
	const apiRequests: Array<{
		requestId: string,
		endpoint: string,
	}> = queryResponses.map(({ meta }: { meta: { [string]: string } }) => ({
		requestId: meta.requestId,
		endpoint: meta.endpoint,
	}));
	return log(response, {
		description: 'nav',
		memberId: parseMemberCookie(response.request.state).id,
		trackId: response.request.state[TRACK_ID_COOKIE] || '',
		sessionId: response.request.state[SESSION_ID_COOKIE] || '',
		url: url || '',
		referer: referrer || '',
		apiRequests,
	});
};

export const trackApi: Tracker = (trackOpts: TrackOpts) => (
	response: Object,
	queryResponses: Array<Object>,
	metadata: ?Object
) => {
	metadata = metadata || {};
	const { url, referrer, method } = metadata;
	if (method === 'get') {
		return trackNav(trackOpts)(response, queryResponses, url, referrer);
	}
	// special case - login requests need to be tracked
	const loginResponse = queryResponses.find(r => r.login);
	const memberId: string = JSON.stringify(
		((((loginResponse || {}).login || {}).value || {}).member || {}).id ||
			''
	);
	if ((((loginResponse && loginResponse.login) || {}).value || {}).member) {
		trackLogin(trackOpts)(response, memberId);
	}
	if ('logout' in response.request.query) {
		trackLogout(trackOpts)(response);
	}
};

export const trackLogin: Tracker = (trackOpts: TrackOpts) => (
	response: Object,
	memberId: string
) =>
	trackOpts.log(response, {
		description: 'login',
		memberId: parseMemberCookie(response.request.state).id,
		trackIdFrom: response.request.state[trackOpts.TRACK_ID_COOKIE] || '',
		trackId: updateTrackId({
			TRACK_ID_COOKIE: trackOpts.TRACK_ID_COOKIE,
			COOKIE_OPTS: trackOpts.COOKIE_OPTS,
		})(response, true),
		sessionId: response.request.state[trackOpts.SESSION_ID_COOKIE],
		url: response.request.info.referrer || '',
	});

export const trackSession: Tracker = ({
	log,
	SESSION_ID_COOKIE,
	TRACK_ID_COOKIE,
	COOKIE_OPTS,
}: TrackOpts) => (response: Object) => {
	if (response.request.state[SESSION_ID_COOKIE]) {
		// if there's already a session id, there's nothing to track
		return null;
	}
	return log(response, {
		description: 'session',
		memberId: parseMemberCookie(response.request.state).id,
		trackId: updateTrackId({ TRACK_ID_COOKIE, COOKIE_OPTS })(response),
		sessionId: newSessionId({ SESSION_ID_COOKIE, COOKIE_OPTS })(response),
		url: response.request.url.path,
	});
};

export const logTrack: string => (Object, Object) => mixed = (
	platform_agent: string
) => (response: Object, trackInfo: Object) => {
	const requestHeaders = response.request.headers;
	const now: Date = new Date();
	const record = {
		timestamp: now.toISOString(),
		requestId: response.request.id,
		ip: requestHeaders['remote-addr'] || '',
		agent: requestHeaders['user-agent'] || '',
		platform: 'mup-web',
		platformAgent: 'WEB', // TODO: set this more accurately, using allowed values from avro schema
		mobileWeb: false,
		referer: '', // misspelled to align with schema
		trax: {},
		...trackInfo,
	};

	avro.loggers.activity(record);
	return record;
};

export function decorateTrack(options: {
	platform_agent: string,
	isProd: boolean,
}) {
	const { platform_agent, isProd } = options;
	const COOKIE_OPTS: CookieOpts = {
		encoding: 'none',
		path: '/',
		isHttpOnly: true,
		isSecure: isProd,
	};

	const TRACK_ID_COOKIE: string = isProd ? 'TRACK_ID' : 'TRACK_ID_DEV';
	const SESSION_ID_COOKIE: string = isProd ? 'SESSION_ID' : 'SESSION_ID_DEV';

	const log: Log = logTrack(platform_agent);
	const trackOpts: TrackOpts = {
		log,
		TRACK_ID_COOKIE,
		SESSION_ID_COOKIE,
		COOKIE_OPTS,
	};
	const api: Log = trackApi(trackOpts);
	const login: Log = trackLogin(trackOpts);
	const logout: Log = trackLogout(trackOpts);
	const session: Log = trackSession(trackOpts);
	const trackers: { [string]: Log } = {
		api,
		login,
		logout,
		session,
	};
	return function(response: Object, trackType: string, ...args: Array<any>) {
		return trackers[trackType](response, ...args);
	};
}

export default function register(
	server: Object,
	options: { platform_agent: string, isProd: boolean },
	next: () => void
) {
	server.decorate('reply', 'activity', decorateTrack(options));

	next();
}

register.attributes = {
	name: 'tracking',
	version: '1.0.0',
};
