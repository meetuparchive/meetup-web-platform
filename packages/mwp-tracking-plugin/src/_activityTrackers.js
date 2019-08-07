// @flow
import { parseIdCookie, updateId } from './util/trackingUtils';
import { ACTIVITY_PLUGIN_NAME } from './config';

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
	standardized_url?: string,
	standardized_referer?: string,
};

export const getTrackApiResponses: TrackGetter = trackOpts => request => (
	fields: ActivityFields
) => {
	const { url = '', referrer = '', ...fieldLiterals } = fields;
	return trackOpts.log(request, {
		description: 'nav',
		memberId: parseIdCookie(request.state[trackOpts.memberCookieName], true), // read memberId
		browserId: updateId(trackOpts.browserIdCookieName)(request), // read/add browserId
		trackId: updateId(trackOpts.trackIdCookieName)(request), // read/add trackId
		referer: referrer,
		url,
		...fieldLiterals,
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
 *    - url: target URL (provided by request.referrer)
 *    - referrer: previous URL (provided by querystring params)
 * 3. lazy-loaded data
 *    - url: proxy endpoint path (request.url.path)
 *    - referrer: current URL (request.referrer)
 * 4. tracking-only request
 *    - url: proxy endpoint path (request.url.path)
 *    - referrer: current URL (request.referrer)
 */
export const getTrackActivity: TrackGetter = () => (request: HapiRequest) => (
	fields: ActivityFields
) => {
	// route may specify a custom 'getFields', which usually means that it is a
	// proxy endpoint that should be tracked differently
	const { getFields } =
		request.route.settings.plugins[ACTIVITY_PLUGIN_NAME] || {};
	const trackFields = getFields
		? getFields(request, fields)
		: {
				...fields,
				url: request.url.path,
				referrer: request.info.referrer || '',
			};
	return request.trackApiResponses(trackFields);
};
