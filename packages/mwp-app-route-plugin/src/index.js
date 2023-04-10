// @flow
import getRoute from './route';

/*
 * The server app route plugin - this applies a wildcard catch-all route that
 * will call the server app rendering function for the correct request language.
 */
export function register(
	server: HapiServer,
	options: {
		languageRenderers: { [string]: LanguageRenderer },
	}
) {
	server.route(getRoute(options.languageRenderers));
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
