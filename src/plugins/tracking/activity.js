// @flow weak
import uuid from 'uuid';
import avro from './avro';
import { parseMemberCookie } from '../../util/cookieUtils';

/*
 * This plugin provides `reply.track...` methods that track events related to
 * particular server responses, e.g. new sesssions and navigation activity.
 *
 * Available trackers:
 * - `trackApi`
 * - `trackSession`
 * - `trackLogin`
 * - `trackLogout`
 */

const YEAR_IN_MS: number = 1000 * 60 * 60 * 24 * 365;
type Logger = (Object, Object) => mixed;
type Tracker = (response: Object, ...args: Array<any>) => mixed;
type TrackOpts = {
	log: Logger,
	trackIdCookieName: string,
	sessionIdCookieName: string,
	cookieOpts: CookieOpts,
};
type TrackGetter = TrackOpts => Tracker;
/**
 * @method newSessionId
 *
 * simple tracking id for the browser session
 *
 * @param {Object} hapi response object
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

/*
 * Initialize the trackId for member or anonymous user - the longest-living id
 * we can assign to a user. Stays in place until login or logout, when it is
 * exchanged for a new trackId
 *
 *  - If the user has a tracking cookie already set, do nothing.
 *  - Otherwise, generate a new uuid and set a tracking cookie.
 */
type UpdateTrackId = ({
	trackIdCookieName: string,
	cookieOpts: CookieOpts,
}) => (Object, ?boolean) => string;

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

export const getTrackLogout: TrackGetter = ({
	log,
	trackIdCookieName,
	sessionIdCookieName,
	cookieOpts,
}: TrackOpts) => (response: Object) =>
	log(response, {
		description: 'logout',
		memberId: parseMemberCookie(response.request.state).id,
		trackIdFrom: response.request.state[trackIdCookieName] || '',
		trackId: updateTrackId({ trackIdCookieName, cookieOpts })(
			response,
			true
		),
		sessionId: response.request.state[sessionIdCookieName],
		url: response.request.info.referrer || '',
	});

export const trackNav: TrackGetter = ({
	log,
	trackIdCookieName,
	sessionIdCookieName,
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
		trackId: response.request.state[trackIdCookieName] || '',
		sessionId: response.request.state[sessionIdCookieName] || '',
		url: url || '',
		referer: referrer || '',
		apiRequests,
	});
};

export const getTrackApi: TrackGetter = (trackOpts: TrackOpts) => (
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
	if (memberId) {
		getTrackLogin(trackOpts)(response, memberId);
	}
	if ('logout' in response.request.query) {
		getTrackLogout(trackOpts)(response);
	}
};

export const getTrackLogin: TrackGetter = (trackOpts: TrackOpts) => (
	response: Object,
	memberId: string
) =>
	trackOpts.log(response, {
		description: 'login',
		memberId: parseMemberCookie(response.request.state).id,
		trackIdFrom: response.request.state[trackOpts.trackIdCookieName] || '',
		trackId: updateTrackId({
			trackIdCookieName: trackOpts.trackIdCookieName,
			cookieOpts: trackOpts.cookieOpts,
		})(response, true),
		sessionId: response.request.state[trackOpts.sessionIdCookieName],
		url: response.request.info.referrer || '',
	});

export const getTrackSession: TrackGetter = ({
	log,
	sessionIdCookieName,
	trackIdCookieName,
	cookieOpts,
}: TrackOpts) => (response: Object) => {
	if (response.request.state[sessionIdCookieName]) {
		// if there's already a session id, there's nothing to track
		return null;
	}
	return log(response, {
		description: 'session',
		memberId: parseMemberCookie(response.request.state).id,
		trackId: updateTrackId({ trackIdCookieName, cookieOpts })(response),
		sessionId: newSessionId({ sessionIdCookieName, cookieOpts })(response),
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

/*
 * Each tracking function is a composition of a logging function and data about
 * the `response` object. This function computes some configuration information
 * to create the tracking functions, and returns each of them in a map keyed by
 * the target `reply` method name
 */
export function getTrackers(options: {
	platform_agent: string,
	isProd: boolean,
}): { [string]: Tracker } {
	const { platform_agent, isProd } = options;
	const cookieOpts: CookieOpts = {
		encoding: 'none',
		path: '/',
		isHttpOnly: true,
		isSecure: isProd,
	};

	const trackIdCookieName: string = isProd ? 'TRACK_ID' : 'TRACK_ID_DEV';
	const sessionIdCookieName: string = isProd
		? 'SESSION_ID'
		: 'SESSION_ID_DEV';

	const log: Logger = logTrack(platform_agent);
	const trackOpts: TrackOpts = {
		log,
		trackIdCookieName,
		sessionIdCookieName,
		cookieOpts,
	};
	const trackers: { [string]: Logger } = {
		trackApi: getTrackApi(trackOpts),
		trackLogin: getTrackLogin(trackOpts),
		trackLogout: getTrackLogout(trackOpts),
		trackSession: getTrackSession(trackOpts),
	};
	return trackers;
}

export default function register(
	server: Object,
	options: { platform_agent: string, isProd: boolean },
	next: () => void
) {
	const trackers: { [string]: Tracker } = getTrackers(options);

	Object.keys(trackers).forEach((trackType: string) => {
		server.decorate('reply', trackType, trackers[trackType]);
	});

	next();
}

register.attributes = {
	name: 'tracking',
	version: '1.0.0',
};
