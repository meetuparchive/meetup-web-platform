// @flow
import url from 'url';
import rison from 'rison';
import { parseIdCookie, updateId } from './util/idUtils';

const parseUrl = url.parse;

/*
 * This module exports specific tracking functions that consume the `request`
 * object and any additional arguments that are relevant to generating the
 * tracking record.
 */

export const getTrackApiResponses: TrackGetter = trackOpts => request => (
	queryResponses: Array<Object>,
	url: ?string,
	referrer: ?string
) => {
	const apiRequests: Array<{
		requestId: string,
		endpoint: string,
	}> = queryResponses.map(({ meta }: { meta: { [string]: string } }) => ({
		requestId: meta.requestId,
		endpoint: meta.endpoint,
	}));
	return trackOpts.log(request, {
		description: 'nav',
		memberId: parseIdCookie(request.state[trackOpts.memberCookieName], true),
		browserId: updateId(trackOpts.browserIdCookieName)(request),
		trackId: updateId(trackOpts.trackIdCookieName)(request),
		url: url || '',
		referer: referrer || '',
		apiRequests,
	});
};

/*
 * This is the core tracking handler - called on every request that generates
 * REST API call(s)
 */
export const getTrackApi: TrackGetter = trackOpts => request => (
	queryResponses: Array<Object>
) => {
	const { method, payload, query, info: { referrer } } = request;
	const requestReferrer = parseUrl(referrer).pathname || '';

	const reqData = method === 'post' ? payload : query;

	if (reqData.metadata) {
		// this is an API-proxy request, so the referrer needs to be read from
		// the reqData. The 'url' is the 'requestReferrer'
		const metadataRison = reqData.metadata || rison.encode_object({});
		const { referrer } = rison.decode_object(metadataRison);
		const url = parseUrl(requestReferrer).pathname;
		return request.trackApiResponses(queryResponses, url, referrer);
	}

	return request.trackApiResponses(
		queryResponses,
		request.url.pathname, // requested url
		requestReferrer // referer
	);
};
