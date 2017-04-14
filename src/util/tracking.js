import uuid from 'uuid';
import { parseMemberCookie } from './cookieUtils';

const isProd = process.env.NODE_ENV === 'production';

const YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;
const COOKIE_OPTS = {
	encoding: 'none',
	path: '/',
	isHttpOnly: true,
	isSecure: isProd,
};

export const TRACK_ID_COOKIE = isProd ? 'TRACK_ID' : 'TRACK_ID_DEV';
export const SESSION_ID_COOKIE = isProd ? 'SESSION_ID' : 'SESSION_ID_DEV';

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
		SESSION_ID_COOKIE,
		sessionId,
		COOKIE_OPTS
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
 * @param {Object} hapi response object
 */
export const updateTrackId = (response, doRefresh) => {
	let trackId = response.request.state[TRACK_ID_COOKIE];

	if (!trackId || doRefresh) {
		// Generate a new trackId cookie
		trackId = uuid.v4();
		response.state(
			TRACK_ID_COOKIE,
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
			memberId: parseInt(parseMemberCookie(response.request.state).id, 10) || 0,
			trackIdFrom: response.request.state[TRACK_ID_COOKIE] || '',
			trackId: updateTrackId(response, true),
			sessionId: response.request.state[SESSION_ID_COOKIE],
			url: response.request.info.referrer | '',
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
			memberId: parseInt(parseMemberCookie(response.request.state).id, 10) || 0,
			trackId: response.request.state[TRACK_ID_COOKIE] || '',
			sessionId: response.request.state[SESSION_ID_COOKIE] || '',
			url: url || '',
			referer: referrer || '',
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
			memberId: parseInt(parseMemberCookie(response.request.state).id, 10) || 0,
			trackIdFrom: response.request.state[TRACK_ID_COOKIE] || '',
			trackId: updateTrackId(response, true),
			sessionId: response.request.state[SESSION_ID_COOKIE],
			url: response.request.info.referrer || '',
		}
	);

export const trackSession = log => response => {
	if (response.request.state[SESSION_ID_COOKIE]) {
		// if there's already a session id, there's nothing to track
		return null;
	}
	return log(
		response,
		{
			description: 'session',
			memberId: parseInt(parseMemberCookie(response.request.state).id, 10) || 0,
			trackId: updateTrackId(response),
			sessionId: newSessionId(response),
			url: response.request.url.path,
		}
	);
};

export const logTrack = platformAgent => (response, trackInfo) => {
	const requestHeaders = response.request.headers;
	const now = new Date();
	const record = {
		timestamp: now.toISOString(),
		requestId: response.request.id,
		ip: requestHeaders['remote-addr'] || '',
		agent: requestHeaders['user-agent'] || '',
		platform: 'mup-web',
		platformAgent: 'WEB',  // TODO: set this more accurately, using allowed values from avro schema
		mobileWeb: false,
		referer: '',  // misspelled to align with schema
		trax: {},
		...trackInfo,
	};

	response.request.log(['activity'], JSON.stringify(record));
	return record;
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

