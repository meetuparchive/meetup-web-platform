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
 *
 * Note that some trackers use cookies to maintain state across sessions - these
 * functions are not guarantees to be pure because they may use the
 * `request.state` interface to set long-lived cookies
 */

/*
 * Track the browser session. This is _independent of login_, and provides a
 * link (JOIN) between track ids pre/post login/logout, but does not carry over
 * to a new browser session
 */
export const getTrackSession: TrackGetter = (trackOpts: TrackOpts) => (
	request: Object
) => {
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
export const getTrackLogout: TrackGetter = (trackOpts: TrackOpts) => (
	request: Object
) => {
	const { log, trackIdCookieName, sessionIdCookieName } = trackOpts;
	return log(request, {
		description: 'logout',
		memberId: parseMemberCookie(request.request.state).id,
		trackIdFrom: request.state[trackIdCookieName] || '',
		trackId: updateTrackId(trackOpts)(request, true),
		sessionId: request.state[sessionIdCookieName],
		url: request.info.referrer || '',
	});
};
export const getTrackLogin: TrackGetter = (trackOpts: TrackOpts) => (
	request: Object,
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

export const getTrackNav: TrackGetter = (trackOpts: TrackOpts) => (
	request: Object,
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

export const getTrackApi: TrackGetter = (trackOpts: TrackOpts) => (
	request: Object,
	queryResponses: Array<Object>
) => {
	const payload = request.method === 'post' ? request.payload : request.query;

	const metadataRison = payload.metadata || rison.encode_object({});
	const metadata = rison.decode_object(metadataRison);
	const originUrl = request.info.referrer;
	metadata.url = parseUrl(originUrl).pathname;
	metadata.method = request.method;

	const { url, referrer, method } = metadata;
	if (method === 'get') {
		return getTrackNav(trackOpts)(request, queryResponses, url, referrer);
	}
	// special case - login requests need to be tracked
	const loginResponse = queryResponses.find(r => r.login);
	const memberId: number =
		((((loginResponse || {}).login || {}).value || {}).member || {}).id || 0;
	if (memberId) {
		getTrackLogin(trackOpts)(request, JSON.stringify(memberId));
	}
	if ('logout' in request.query) {
		getTrackLogout(trackOpts)(request);
	}
};
