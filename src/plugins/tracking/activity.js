// @flow
import avro from './util/avro';
import {
	getTrackApi,
	getTrackSession,
	getTrackApiResponses,
} from './_activityTrackers';

const YEAR_IN_MS: number = 1000 * 60 * 60 * 24 * 365;
export const ACTIVITY_PLUGIN_NAME = 'tracking';

/*
 * This plugin provides `request.track...` methods that track events related to
 * particular server responses, e.g. new sesssions and navigation activity.
 *
 * Available trackers:
 * - `trackApi`
 * - `trackSession`
 * - `trackLogin`
 * - `trackLogout`
 */

export const getLogger: string => (Object, Object) => mixed = (
	agent: string
) => (request: Object, trackInfo: Object) => {
	const requestHeaders = request.headers;
	const now: Date = new Date();
	const record = {
		timestamp: now.toISOString(),
		requestId: request.id,
		ip: requestHeaders['remote-addr'] || '',
		agent: requestHeaders['user-agent'] || '',
		platform: 'WEB',
		platformAgent: agent,
		mobileWeb: false,
		referer: '', // misspelled to align with schema
		trax: {},
		isUserActivity: true,
		...trackInfo,
	};

	avro.loggers.activity(record);
	return record;
};

/*
 * Each tracking function is a composition of a logging function and data about
 * the `request` object. This function computes some configuration information
 * to create the tracking functions, and returns each of them in a map keyed by
 * the target `request` method name
 */
export function getTrackers(options: {
	agent: string,
	trackIdCookieName: string,
	sessionIdCookieName: string,
}): { [string]: Tracker } {
	const { agent, trackIdCookieName, sessionIdCookieName } = options;

	const log: Logger = getLogger(agent);
	const trackOpts: TrackOpts = {
		log,
		trackIdCookieName,
		sessionIdCookieName,
	};
	// These are the tracking methods that will be set on the `request` interface
	const trackers: { [string]: Tracker } = {
		trackApi: getTrackApi(trackOpts),
		trackSession: getTrackSession(trackOpts),
		trackApiResponses: getTrackApiResponses(trackOpts),
	};
	return trackers;
}

/*
 * Run request-initialization routines, e.g. creating plugin data store
 */
const onRequest = (request, reply) => {
	// initialize request.plugins[ACTIVITY_PLUGIN_NAME] to store cookie vals
	request.plugins[ACTIVITY_PLUGIN_NAME] = {};
	reply.continue();
};
/*
 * Read from request data to prepare/modify response. Mainly looking for new
 * tracking cookies that need to be set using request.response.state.
 */
const getOnPreResponse = cookieConfig => (request, reply) => {
	const { sessionId, trackId } = request.plugins[ACTIVITY_PLUGIN_NAME];
	const { sessionIdCookieName, trackIdCookieName, isProd } = cookieConfig;
	const cookieOpts: CookieOpts = {
		encoding: 'none',
		path: '/',
		isHttpOnly: true,
		isSecure: isProd,
	};

	if (sessionId) {
		request.response.state(sessionIdCookieName, sessionId, cookieOpts);
	}
	if (trackId) {
		request.response.state(trackIdCookieName, trackId, {
			...cookieOpts,
			ttl: YEAR_IN_MS * 20,
		});
	}
	reply.continue();
};

/*
 * The plugin register function that will 'decorate' the `request` interface with
 * all tracking functions returned from `getTrackers`, as well as assign request
 * lifecycle event handlers that can affect the response, e.g. by setting cookies
 */
export default function register(
	server: Object,
	options: { agent: string, isProd: boolean },
	next: () => void
) {
	const { agent, isProd } = options;

	const sessionIdCookieName: string = isProd ? 'SESSION_ID' : 'SESSION_ID_DEV';
	const trackIdCookieName: string = isProd ? 'TRACK_ID' : 'TRACK_ID_DEV';

	const trackers: { [string]: Tracker } = getTrackers({
		agent,
		trackIdCookieName,
		sessionIdCookieName,
	});

	Object.keys(trackers).forEach((trackType: string) => {
		server.decorate('request', trackType, trackers[trackType], {
			apply: true, // make the `request` available to tracker
		});
	});

	server.ext('onRequest', onRequest);
	server.ext(
		'onPreResponse',
		getOnPreResponse({ sessionIdCookieName, trackIdCookieName, isProd })
	);

	next();
}

register.attributes = {
	name: ACTIVITY_PLUGIN_NAME,
	version: '1.0.0',
};
