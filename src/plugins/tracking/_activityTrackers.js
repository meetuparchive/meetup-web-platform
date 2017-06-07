// @flow
import url from 'url';
import rison from 'rison';
import { parseMemberCookie } from '../../util/cookieUtils';
import { updateTrackId, newSessionId } from './util/idUtils';

const parseUrl = url.parse;

/*
 * This module exports specific tracking functions that consume the `response`
 * object and any additional arguments that are relevant to generating the
 * tracking record.
 *
 * Note that some trackers use cookies to maintain state across sessions - these
 * functions are not guarantees to be pure because they may use the
 * `response.state` interface to set long-lived cookies
 */

/*
 * Track the browser session. This is _independent of login_, and provides a
 * link (JOIN) between track ids pre/post login/logout, but does not carry over
 * to a new browser session
 */
export const getTrackSession: TrackGetter = (trackOpts: TrackOpts) => (
	response: Object
) => {
	const { log, sessionIdCookieName, trackIdCookieName, cookieOpts } = trackOpts;
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

/*
 * Track logout actions - this function is not used to produce a top-level
 * tracker because the `trackApi` tracker delegates to it as necessary
 */
export const getTrackLogout: TrackGetter = (trackOpts: TrackOpts) => (
	response: Object
) => {
	const { log, trackIdCookieName, sessionIdCookieName, cookieOpts } = trackOpts;
	return log(response, {
		description: 'logout',
		memberId: parseMemberCookie(response.request.state).id,
		trackIdFrom: response.request.state[trackIdCookieName] || '',
		trackId: updateTrackId({ trackIdCookieName, cookieOpts })(response, true),
		sessionId: response.request.state[sessionIdCookieName],
		url: response.request.info.referrer || '',
	});
};
export const getTrackLogin: TrackGetter = (trackOpts: TrackOpts) => (
	response: Object,
	memberId: string
) => {
	const { log, trackIdCookieName, sessionIdCookieName, cookieOpts } = trackOpts;
	return log(response, {
		description: 'login',
		memberId: parseMemberCookie(response.request.state).id,
		trackIdFrom: response.request.state[trackIdCookieName] || '',
		trackId: updateTrackId({
			trackIdCookieName: trackIdCookieName,
			cookieOpts: cookieOpts,
		})(response, true),
		sessionId: response.request.state[sessionIdCookieName],
		url: response.request.info.referrer || '',
	});
};

export const getTrackNav: TrackGetter = (trackOpts: TrackOpts) => (
	response: Object,
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
	queryResponses: Array<Object>
) => {
	const { request } = response;
	const payload = request.method === 'post' ? request.payload : request.query;

	const metadataRison = payload.metadata || rison.encode_object({});
	const metadata = rison.decode_object(metadataRison);
	const originUrl = request.info.referrer;
	metadata.url = parseUrl(originUrl).pathname;
	metadata.method = request.method;

	const { url, referrer, method } = metadata;
	if (method === 'get') {
		return getTrackNav(trackOpts)(response, queryResponses, url, referrer);
	}
	// special case - login requests need to be tracked
	const loginResponse = queryResponses.find(r => r.login);
	const memberId: number =
		((((loginResponse || {}).login || {}).value || {}).member || {}).id || 0;
	if (memberId) {
		getTrackLogin(trackOpts)(response, JSON.stringify(memberId));
	}
	if ('logout' in response.request.query) {
		getTrackLogout(trackOpts)(response);
	}
};
