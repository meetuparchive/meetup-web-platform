// @flow
import avro from './util/avro';
import { getTrackApi, getTrackSession } from './_activityTrackers';

/*
 * This plugin provides `reply.track...` methods that track events related to
 * particular server responses, e.g. new sesssions and navigation activity.
 *
 * Available trackers:
 * - `trackApi`
 * - `trackSession`
 * - `trackLogin`
 * - `trackLogout`
 */

export const getLogger: string => (Object, Object) => mixed = (
	platform_agent: string
) => (response: Object, trackInfo: Object) => {
	const requestHeaders = response.request.headers;
	const now: Date = new Date();
	const record = {
		timestamp: now.toISOString(),
		requestId: response.request.id,
		ip: requestHeaders['remote-addr'] || '',
		agent: requestHeaders['user-agent'] || '',
		platform: 'mup-web',
		platformAgent: 'WEB', // TODO: set this more accurately, using allowed values from avro schema
		mobileWeb: false,
		referer: '', // misspelled to align with schema
		trax: {},
		...trackInfo,
	};

	avro.loggers.activity(record);
	return record;
};

/*
 * Each tracking function is a composition of a logging function and data about
 * the `response` object. This function computes some configuration information
 * to create the tracking functions, and returns each of them in a map keyed by
 * the target `reply` method name
 */
export function getTrackers(options: {
	platform_agent: string,
	isProd: boolean,
}): { [string]: Tracker } {
	const { platform_agent, isProd } = options;
	const cookieOpts: CookieOpts = {
		encoding: 'none',
		path: '/',
		isHttpOnly: true,
		isSecure: isProd,
	};

	const trackIdCookieName: string = isProd ? 'TRACK_ID' : 'TRACK_ID_DEV';
	const sessionIdCookieName: string = isProd ? 'SESSION_ID' : 'SESSION_ID_DEV';

	const log: Logger = getLogger(platform_agent);
	const trackOpts: TrackOpts = {
		log,
		trackIdCookieName,
		sessionIdCookieName,
		cookieOpts,
	};
	// These are the tracking methods that will be set on the `reply` interface
	const trackers: { [string]: Tracker } = {
		trackApi: getTrackApi(trackOpts),
		trackSession: getTrackSession(trackOpts),
	};
	return trackers;
}

/*
 * The plugin register function that will 'decorate' the `reply` interface with
 * all tracking functions returned from `getTrackers`
 */
export default function register(
	server: Object,
	options: { platform_agent: string, isProd: boolean },
	next: () => void
) {
	const trackers: { [string]: Tracker } = getTrackers(options);

	Object.keys(trackers).forEach((trackType: string) => {
		server.decorate('reply', trackType, trackers[trackType]);
	});

	next();
}

register.attributes = {
	name: 'tracking',
	version: '1.0.0',
};
