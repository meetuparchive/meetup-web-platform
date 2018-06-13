import { parseIdCookie } from './idUtils'; // TODO: provide this info through new plugin
import avro from './avro';
import { COOKIE_NAME } from './clickState';

/*
 * This module provides utilities for reading click cookie data sent as part of
 * a request to the application - it should be set up as a server plugin
 */

const isProd = process.env.NODE_ENV === 'production';
const memberCookieName = isProd ? 'MEETUP_MEMBER' : 'MEETUP_MEMBER_DEV';
export const clickCookieOptions = {
	isSecure: isProd,
	isHttpOnly: false,
	domain: `${isProd ? '' : '.dev'}.meetup.com`,
};

export const clickToClickRecord = request => click => {
	return {
		timestamp: click.timestamp || new Date().toISOString(),
		requestId: request.id,
		memberId: parseIdCookie(
			request.state[memberCookieName].toString() || '',
			true
		), // force integer
		lineage: click.lineage,
		linkText: click.linkText || '',
		coordX: click.coords[0] || 0,
		coordY: click.coords[1] || 0,
	};
};

export default function processClickTracking(request, reply) {
	const rawCookieValue = (request.state || {})[COOKIE_NAME];
	// It's possible that multiple cookies with the same value were sent, e.g.
	// one value for .dev.meetup.com and another for .meetup.com - parse only the first
	const cookieValue =
		rawCookieValue instanceof Array ? rawCookieValue[0] : rawCookieValue;
	if (!cookieValue || cookieValue === 'undefined') {
		return;
	}

	const cookieJSON = decodeURIComponent(cookieValue);
	const { history } = JSON.parse(cookieJSON);
	history.map(clickToClickRecord(request)).forEach(avro.loggers.click);

	reply.unstate(COOKIE_NAME, clickCookieOptions);
	return;
}
