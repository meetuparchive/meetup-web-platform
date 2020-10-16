// @flow
import LaunchDarkly from 'launchdarkly-node-server-sdk';

import getRoute from './route';
import { fetchLaunchDarklySdkKey } from './util/secretsHelper';

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
): Promise<any> {
	server.route(getRoute(options.languageRenderers));

	return fetchLaunchDarklySdkKey().then(launchDarklySdkKey => {
		console.log(
			`Using fetched key ${(launchDarklySdkKey || '').substring(0, 5)}`
		);
		try {
			const ldClient = LaunchDarkly.init(options.ldkey || launchDarklySdkKey, {
				offline: process.env.NODE_ENV === 'test',
			});

			server.expose('getFlags', (user: LaunchDarklyUser) => {
				return ldClient.allFlagsState(user).then(
					state => state.allValues(),
					err => {
						server.app.logger.error({
							err,
							member: user,
						});
						return {}; // return empty flags on error
					}
				);
			});

			// set up launchdarkly instance before continuing
			if (ldClient.close) {
				server.events.on('stop', ldClient.close);
			}

			// https://github.com/launchdarkly/node-client/issues/96
			// use waitForInitialization to catch launch darkly failures
			return ldClient.waitForInitialization().catch(error => {
				console.error(error);
				return {}; // return empty flags on connection error
			});
		} catch (error) {
			console.error(
				'The LaunchDarkly key may not have resolved properly.  Double check that it is in the SecretsManager, has a name of LaunchDarkly and a key of "apiAccessToken"'
			);

			server.expose('getFlags', (user: LaunchDarklyUser) => {
				server.app.logger.error({
					error,
					member: user,
				});
				return {}; // return empty flags on error
			});
		}
	});
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
