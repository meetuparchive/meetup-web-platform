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

	const { url, referrer } = metadata;

	// special case - login requests need to be tracked (This needs to be
	// redone when login/logout is fully implemented)
	return request.trackApiResponses(queryResponses, url, referrer);
};
