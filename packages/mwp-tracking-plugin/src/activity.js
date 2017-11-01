// @flow
import avro from './util/avro';
import { getTrackActivity, getTrackApiResponses } from './_activityTrackers';
import { ACTIVITY_PLUGIN_NAME } from './config';

const YEAR_IN_MS: number = 1000 * 60 * 60 * 24 * 365;

/*
 * This plugin provides `request.track...` methods that track events related to
 * particular server responses, e.g. new sesssions and navigation activity.
 *
 * Available trackers:
 * - `trackActivity`
 */

export const getLogger: string => (Object, Object) => mixed = (
	agent: string
) => (request: Object, trackInfo: Object) => {
	const requestHeaders = request.headers;

	// get an iso8601 timestamp that represents the time in 'America/New York'
	// instead of the default UTC
	const formatOptions = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZone: 'America/New_York',
		hour12: false,
	};
	const nycFormatter = new Intl.DateTimeFormat('en-US', formatOptions);
	const { year, month, day, hour, minute, second } = nycFormatter
		.formatToParts(new Date())
		.reduce((parts, part) => {
			parts[part.type] = parseInt(part.value, 10);
			return parts;
		}, {});
	const fakeUTC = new Date(Date.UTC(year, month, day, hour, minute, second));

	const record = {
		timestamp: fakeUTC.toISOString(),
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
	browserIdCookieName: string,
	memberCookieName: string,
	trackIdCookieName: string,
}): { [string]: Tracker } {
	const {
		agent,
		browserIdCookieName,
		memberCookieName,
		trackIdCookieName,
	} = options;

	const log: Logger = getLogger(agent);
	const trackOpts: TrackOpts = {
		log,
		browserIdCookieName,
		memberCookieName,
		trackIdCookieName,
	};
	// These are the tracking methods that will be set on the `request` interface
	const trackers: { [string]: Tracker } = {
		trackActivity: getTrackActivity(trackOpts),
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
	const { browserIdCookieName, trackIdCookieName } = cookieConfig;
	const pluginData = request.plugins[ACTIVITY_PLUGIN_NAME];
	const browserId = pluginData.browserIdCookieName;
	const trackId = pluginData.trackIdCookieName;

	const FOREVER: CookieOpts = {
		encoding: 'none',
		path: '/',
		isHttpOnly: true,
		ttl: YEAR_IN_MS * 20,
	};

	if (browserId) {
		request.response.state(browserIdCookieName, browserId, FOREVER);
	}
	if (trackId) {
		request.response.state(trackIdCookieName, trackId, FOREVER);
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

	const trackIdCookieName: string = isProd
		? 'MEETUP_TRACK'
		: 'MEETUP_TRACK_DEV';
	const browserIdCookieName: string = isProd
		? 'MEETUP_BROWSER_ID'
		: 'MEETUP_BROWSER_ID_DEV';
	const memberCookieName: string = isProd
		? 'MEETUP_MEMBER'
		: 'MEETUP_MEMBER_DEV';

	const trackers: { [string]: Tracker } = getTrackers({
		agent,
		browserIdCookieName,
		memberCookieName,
		trackIdCookieName,
	});

	Object.keys(trackers).forEach((trackType: string) => {
		server.decorate('request', trackType, trackers[trackType], {
			apply: true, // make the `request` available to tracker
		});
	});

	server.ext('onRequest', onRequest);
	server.ext(
		'onPreResponse',
		getOnPreResponse({
			browserIdCookieName,
			memberCookieName,
			trackIdCookieName,
		})
	);

	next();
}

register.attributes = {
	name: ACTIVITY_PLUGIN_NAME,
	version: '1.0.0',
};
