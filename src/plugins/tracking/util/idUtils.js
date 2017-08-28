// @flow
import querystring from 'qs';
import uuid from 'uuid';
import { ACTIVITY_PLUGIN_NAME } from '../activity';

type UpdateId = string => (Object, ?boolean) => string;
/*
 * Initialize the trackId for member or anonymous user - the longest-living id
 * we can assign to a user. Stays in place until login or logout, when it is
 * exchanged for a new trackId
 *
 *  - If the user has a tracking cookie already set, do nothing.
 *  - Otherwise, generate a new uuid and set a tracking cookie.
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
	return parseIdCookie(cookieVal).toString(); // toString used to satisfy Flow
};

/*
 * This function creates a new browser session id and stores it in the request.
 * A corresponding cookie will be set in the plugin's onResponse handler in
 * order to share the session cookie across browser tabs.
 */
export const newId = (cookieName: string) => (request: HapiRequest): string => {
	const id: string = uuid.v4();
	request.plugins[ACTIVITY_PLUGIN_NAME][cookieName] = makeIdCookie(id);
	return id;
};

export const makeIdCookie = (id: string) => `id=${id}`;
export const parseIdCookie = (cookieVal: string, doParseInt?: boolean) => {
	const parsed: { id: string } = querystring.parse(cookieVal) || { id: '' };
	parsed.id = parsed.id || '';
	if (doParseInt) {
		return parseInt(parsed.id, 10) || 0;
	}
	return parsed.id;
};
