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

type ActivityFields = {
	url?: string,
	referrer?: string,
	viewName?: string,
	subViewName?: string,
};

export const getTrackApiResponses: TrackGetter = trackOpts => request => (
	fields: ActivityFields
) => {
	const { url = '', referrer = '', viewName, subViewName } = fields;
	return trackOpts.log(request, {
		description: 'nav',
		memberId: parseIdCookie(
			request.state[trackOpts.memberCookieName].toString() || '',
			true
		), // read memberId
		browserId: updateId(trackOpts.browserIdCookieName)(request), // read/add browserId
		trackId: updateId(trackOpts.trackIdCookieName)(request), // read/add trackId
		referer: referrer,
		url,
		viewName,
		subViewName,
	});
};

/*
 * This is the core tracking handler - called on every request that generates
 * REST API call(s)
 */
export const getTrackActivity: TrackGetter = trackOpts => request => (
	fields: ActivityFields
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
		return request.trackApiResponses({ url, referrer, ...fields });
	}

	return request.trackApiResponses({
		url: request.url.pathname, // requested url
		referrer: requestReferrer, // referer
		...fields,
	});
};
