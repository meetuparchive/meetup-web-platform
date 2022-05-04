// @flow
import querystring from 'qs';
import uuid from 'uuid';
import { DateTimeFormatter, ZonedDateTime, ZoneId } from 'js-joda';

import { ACTIVITY_PLUGIN_NAME } from '../config';

// Ensure timezone info is available
require('js-joda-timezone');

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

// Format `zonedDateTime` as an ISO 8601 datetime with UTC offset.
// For example, a `ZonedDateTime` instance representing the datetime of
// January 7, 2019 at 10:27:02 (and 791 microseconds), in the timezone of NYC
// (EST, or 5 hours behind UTC/GMT), would be formatted as:
//   2019-01-07T10:27:02.791-05:00
export const getISOStringWithUTCOffset = (zonedDateTime: ZonedDateTime) =>
	DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(zonedDateTime);

// Get current time as an ISO Date Time String with UTC offset
export const getISOStringNow = (tz: string = 'America/New_York') =>
	getISOStringWithUTCOffset(ZonedDateTime.now(ZoneId.of(tz)));

export const EVENT_SOURCES = {
	buildMeetup: 'build_meetup',
	chapstick: 'chapstick',
};

const isChapstickEvent = (id: string): boolean => id.includes('!chp');
export const getOriginalEventId = (id: string): string =>
	isChapstickEvent(id) ? id.slice(0, -4) : id;
export const getEventSource = (id: string): string =>
	isChapstickEvent(id) ? EVENT_SOURCES.chapstick : EVENT_SOURCES.buildMeetup;
