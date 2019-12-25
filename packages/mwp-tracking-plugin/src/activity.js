// @flow
import avro from './util/avro';
import { getTrackActivity, getTrackApiResponses } from './_activityTrackers';
import { ACTIVITY_PLUGIN_NAME } from './config';
import { getISOStringNow } from './util/trackingUtils';

const YEAR_IN_MS: number = 1000 * 60 * 60 * 24 * 365;

/*
 * This plugin provides `request.track...` methods that track events related to
 * particular server responses, e.g. new sesssions and navigation activity.
 *
 * Available trackers:
 * - `trackActivity`
 */

type ActivityPlatform = 'WEB' | 'IOS' | 'ANDROID';
const ANDROID_APP_ID = 'com.meetup';

export const getRequestPlatform = (request: HapiRequest): ActivityPlatform => {
	const { headers, state, query = {} } = request;
	const isNativeApp = state.isNativeApp || query.isNativeApp;
	if (isNativeApp) {
		// recommended test for Android WebView - not perfect but should be adequate
		// https://stackoverflow.com/questions/24291315/android-webview-detection-in-php
		const isAndroid = headers.http_x_requested_with === ANDROID_APP_ID;
		return isAndroid ? 'ANDROID' : 'IOS';
	}
	return 'WEB';
};

export const getLogger: string => (Object, Object) => mixed = (agent: string) => {
	return (request: Object, trackInfo: Object) => {
		const { headers } = request;

		const record = {
			timestamp: getISOStringNow(),
			requestId: request.id,
			ip: headers['remote-addr'] || '',
			agent: headers['user-agent'] || '',
			platform: getRequestPlatform(request),
			platformAgent: agent,
			mobileWeb: false,
			referer: '', // misspelled to align with schema
			trax: {},
			isUserActivity: true,
			...trackInfo,
		};

		avro.loggers.awsactivity(record);
		return record;
	};
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
const onRequest = (request, h) => {
	// initialize request.plugins[ACTIVITY_PLUGIN_NAME] to store cookie vals
	request.plugins[ACTIVITY_PLUGIN_NAME] = {};
	return h.continue;
};
/*
 * Read from request data to prepare/modify response. Mainly looking for new
 * tracking cookies that need to be set using request.response.state.
 */

type CookieOpts = {
	browserIdCookieName: string,
	memberCookieName: string,
	trackIdCookieName: string,
	domain: string,
};
export const getOnPreResponse = (cookieConfig: CookieOpts) => (
	request: HapiRequest,
	h: HapiResponseToolkit
) => {
	const { browserIdCookieName, trackIdCookieName, domain } = cookieConfig;
	const pluginData = request.plugins[ACTIVITY_PLUGIN_NAME];
	const browserId = pluginData[browserIdCookieName];
	const trackId = pluginData[trackIdCookieName];

	const FOREVER: HapiServerStateCookieOptions = {
		domain,
		encoding: 'none',
		path: '/',
		isHttpOnly: true,
		ttl: YEAR_IN_MS * 20,
		strictHeader: false, // skip strict cookie format validation (no quotes)
	};

	if (!request.response.isBoom) {
		if (browserId) {
			h.state(browserIdCookieName, browserId, FOREVER);
		}
		if (trackId) {
			h.state(trackIdCookieName, trackId, FOREVER);
		}
	}

	return h.continue;
};

/*
 * The plugin register function that will 'decorate' the `request` interface with
 * all tracking functions returned from `getTrackers`, as well as assign request
 * lifecycle event handlers that can affect the response, e.g. by setting cookies
 */
export function register(
	server: Object,
	options: { agent: string, isProdApi: boolean }
) {
	const { agent, isProdApi } = options;

	const trackIdCookieName: string = isProdApi ? 'MEETUP_TRACK' : 'MEETUP_TRACK_DEV';
	const browserIdCookieName: string = isProdApi
		? 'MEETUP_BROWSER_ID'
		: 'MEETUP_BROWSER_ID_DEV';
	const memberCookieName: string = isProdApi
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
			domain: isProdApi ? '.meetup.com' : '.dev.meetup.com',
		})
	);
}

export const plugin = {
	register,
	name: ACTIVITY_PLUGIN_NAME,
	version: '1.0.0',
};
