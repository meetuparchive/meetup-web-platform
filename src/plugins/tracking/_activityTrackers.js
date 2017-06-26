// @flow
import url from 'url';
import rison from 'rison';
import { parseMemberCookie } from '../../util/cookieUtils';
import { updateTrackId, newSessionId } from './util/idUtils';

const parseUrl = url.parse;

/*
 * This module exports specific tracking functions that consume the `request`
 * object and any additional arguments that are relevant to generating the
 * tracking record.
 */

/*
 * Track the browser session. This is _independent of login_, and provides a
 * link (JOIN) between track ids pre/post login/logout, but does not carry over
 * to a new browser session
 */
export const getTrackSession: TrackGetter = trackOpts => request => () => {
	const { log, sessionIdCookieName } = trackOpts;
	if (request.state[sessionIdCookieName]) {
		// if there's already a session id, there's nothing to track
		return null;
	}
	return log(request, {
		description: 'session',
		memberId: parseMemberCookie(request.state).id,
		trackId: updateTrackId(trackOpts)(request),
		sessionId: newSessionId(request),
		url: request.url.path,
	});
};

/*
 * Track logout actions - this function is not used to produce a top-level
 * tracker because the `trackApi` tracker delegates to it as necessary
 */
export const getTrackLogout: TrackGetter = trackOpts => request => () => {
	const { log, trackIdCookieName, sessionIdCookieName } = trackOpts;
	return log(request, {
		description: 'logout',
		memberId: parseMemberCookie(request.state).id,
		trackIdFrom: request.state[trackIdCookieName] || '',
		trackId: updateTrackId(trackOpts)(request, true), // `true` force trackId refresh
		sessionId: request.state[sessionIdCookieName],
		url: request.info.referrer || '',
	});
};
export const getTrackLogin: TrackGetter = trackOpts => request => (
	memberId: string
) => {
	const { log, trackIdCookieName, sessionIdCookieName } = trackOpts;
	return log(request, {
		description: 'login',
		memberId: parseMemberCookie(request.state).id,
		trackIdFrom: request.state[trackIdCookieName] || '',
		trackId: updateTrackId(trackOpts)(request, true),
		sessionId: request.state[sessionIdCookieName],
		url: request.info.referrer || '',
	});
};

export const getTrackApiResponses: TrackGetter = trackOpts => request => (
	queryResponses: Array<Object>,
	url: string,
	referrer: string
) => {
	const { log, trackIdCookieName, sessionIdCookieName } = trackOpts;
	const apiRequests: Array<{
		requestId: string,
		endpoint: string,
	}> = queryResponses.map(({ meta }: { meta: { [string]: string } }) => ({
		requestId: meta.requestId,
		endpoint: meta.endpoint,
	}));
	return log(request, {
		description: 'nav',
		memberId: parseMemberCookie(request.state).id,
		trackId: request.state[trackIdCookieName] || '',
		sessionId: request.state[sessionIdCookieName] || '',
		url: url || '',
		referer: referrer || '',
		apiRequests,
	});
};

/*
 * get the trackApi handler - the core tracking handler for navigation and
 * login-related activity.
 */
export const getTrackApi: TrackGetter = trackOpts => request => (
	queryResponses: Array<Object>
) => {
	const payload = request.method === 'post' ? request.payload : request.query;

	const metadataRison = payload.metadata || rison.encode_object({});
	const metadata = rison.decode_object(metadataRison);
	const originUrl = request.info.referrer;
	metadata.url = parseUrl(originUrl).pathname;
	metadata.method = request.method;

	const { url, referrer, method } = metadata;

	// special case - login requests need to be tracked (This needs to be
	// redone when login/logout is fully implemented)
	if (method === 'post') {
		const loginResponse = queryResponses.find(r => r.login);
		const memberId: number =
			((((loginResponse || {}).login || {}).value || {}).member || {}).id || 0;
		if (memberId) {
			request.trackLogin(JSON.stringify(memberId));
		}
		if ('logout' in request.query) {
			request.trackLogout();
		}
	}
	return request.trackApiResponses(queryResponses, url, referrer);
};
