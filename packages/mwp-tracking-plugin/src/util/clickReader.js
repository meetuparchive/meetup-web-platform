import { parseIdCookie, getISOStringNow } from './trackingUtils'; // TODO: provide this info through new plugin
import avro from './avro';
import { COOKIE_NAME } from './clickState';

/*
 * This module provides utilities for reading click cookie data sent as part of
 * a request to the application - it should be set up as a server plugin
 */

const isProd = process.env.NODE_ENV === 'production';
export const clickCookieOptions = {
	isSecure: isProd,
	isHttpOnly: false,
	domain: `${isProd ? '' : '.dev'}.meetup.com`,
	path: '/',
};

export const clickToClickRecord = request => click => {
	const memberCookieName = request.server.settings.app.api.isProd
		? 'MEETUP_MEMBER'
		: 'MEETUP_MEMBER_DEV';
	return {
		timestamp: click.timestamp || getISOStringNow(),
		requestId: request.id,
		memberId: parseIdCookie(request.state[memberCookieName], true), // force integer
		lineage: click.lineage,
		linkText: click.linkText || '',
		coordX: click.coords[0] || 0,
		coordY: click.coords[1] || 0,
		tag: click.tag,
	};
};

export default function processClickTracking(request, h) {
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

	history
		.filter(click => click)
		.map(clickToClickRecord(request))
		.forEach(avro.loggers.awsclick);

	h.unstate(COOKIE_NAME, clickCookieOptions);
	return h.continue;
}
