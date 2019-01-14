// @flow
import rison from 'rison';
import { parseIdCookie, updateId } from './util/trackingUtils';

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
		memberId: parseIdCookie(request.state[trackOpts.memberCookieName], true), // read memberId
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
 *
 * 1. Server render (initial navigation)
 *    - url: target URL (request.url.path)
 *    - referrer: previous URL (request.referrer)
 * 2. SPA navigation
 *    - url: target URL (provided by querystring params)
 *    - referrer: previous URL (provided by querystring params)
 * 3. lazy-loaded data
 *    - url: proxy endpoint path (request.url.path)
 *    - referrer: current URL (request.referrer)
 * 4. tracking-only request
 *    - url: proxy endpoint path (request.url.path)
 *    - referrer: current URL (request.referrer)
 */
export const getTrackActivity: TrackGetter = () => request => (
	fields: ActivityFields
) => {
	const { url, method, payload, query, info: { referrer } } = request;
	const requestReferrer = referrer || '';
	const reqData = method === 'post' ? payload : query;

	// the request may specify a referrer that should be used instead of the `request.referrer`
	const referrerOverride =
		reqData.metadata && (rison.decode_object(reqData.metadata) || {}).referrer;

	const urlFields = referrerOverride
		? {
				url: requestReferrer, // original request referrer is passed through as URL
				referrer: referrerOverride,
			}
		: {
				url: url.path,
				referrer: requestReferrer,
			};

	return request.trackApiResponses({
		...urlFields,
		...fields,
	});
};
