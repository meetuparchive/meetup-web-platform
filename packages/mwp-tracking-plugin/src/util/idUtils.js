// @flow
import querystring from 'qs';
import uuid from 'uuid';
import { ACTIVITY_PLUGIN_NAME } from '../config';

type UpdateId = string => (Object, ?boolean) => string;
/*
 * This is a 'get or set' function for the `cookieName` passed in.
 */
export const updateId: UpdateId = cookieName => (
	request: Object,
	doRefresh: ?boolean
) => {
	let cookieVal: string =
		request.state[cookieName] || // cookie in original request
		request.plugins[ACTIVITY_PLUGIN_NAME][cookieName]; // cookie added to outgoing response

	if (!cookieVal || doRefresh) {
		// Generate a new id value and store in request. Cookie will be
		// set in the plugin's onResponse handler
		return newId(cookieName)(request);
	}
	return parseIdCookie(cookieVal.toString() || '').toString(); // toString used to satisfy Flow
};

/*
 * This function creates a new uuid and stores it in the request using a
 * `cookieName` key. The actual cookie will be set in the plugin's `onResponse`
 * handler in order to share the cookie across browser tabs.
 */
export const newId = (cookieName: string) => (request: HapiRequest): string => {
	const id: string = uuid.v4();
	request.plugins[ACTIVITY_PLUGIN_NAME][cookieName] = makeIdCookie(id);
	return id;
};

// chapstick cookies generally wrap cookie values with quotes, which is broken
// and wrong, but when in Rome...
export const makeIdCookie = (id: string) => `"id=${id}"`;
export const parseIdCookie = (
	cookieVal: ?string | ?Array<string>,
	doParseInt?: boolean
) => {
	const cleanCookie =
		cookieVal && cookieVal instanceof Array ? cookieVal[0] : cookieVal;
	const parsed: { id: string } = querystring.parse(
		(cleanCookie || '').toString().replace(/^"|"$/g, '') // strip nasty leading/ending quotes
	) || { id: '' };
	parsed.id = parsed.id || '';
	if (doParseInt) {
		return parseInt(parsed.id, 10) || 0;
	}
	return parsed.id;
};
