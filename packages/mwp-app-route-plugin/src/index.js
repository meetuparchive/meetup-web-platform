// @flow
import LaunchDarkly from 'ldclient-node';
import getRoute from './route';

const LAUNCH_DARKLY_SDK_KEY = 'sdk-86b4c7a9-a450-4527-a572-c80a603a200f';

/*
 * The server app route plugin - this applies a wildcard catch-all route that
 * will call the server app rendering function for the correct request language.
 */
export function register(
	server: HapiServer,
	options: {
		languageRenderers: { [string]: LanguageRenderer },
		ldkey?: string,
	}
) {
	server.route(getRoute(options.languageRenderers));

	const ldClient = LaunchDarkly.init(options.ldkey || LAUNCH_DARKLY_SDK_KEY, {
		offline: process.env.NODE_ENV === 'test',
	});
	server.expose('getFlags', memberObj => {
		const key = (memberObj && memberObj.id) || 0;
		return ldClient.all_flags({ ...memberObj, key, anonymous: key === 0 }).then(
			flags => flags,
			err => {
				server.app.logger.error({
					err,
					member: memberObj,
				});
				return {}; // return empty flags on error
			}
		);
	});
	// set up launchdarkly instance before continuing
	server.events.on('stop', ldClient.close);
}

export const plugin = {
	register,
	name: 'mwp-app-route',
	version: '1.0.0',
	dependencies: [
		'mwp-language-plugin', // provides `request.getPrefixedPath` and `request.getLanguage`
		'electrode-csrf-jwt', // sets CSRF jwt on initial request
	],
};
