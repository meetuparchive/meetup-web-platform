// @flow
import getRoute from './route';

/*
 * The server app route plugin - this applies a wildcard catch-all route that
 * will call the server app rendering function for the correct request language.
 */
export default function register(
	server: HapiServer,
	options: { languageRenderers: { [string]: LanguageRenderer$ } },
	next: () => void
) {
	server.route(getRoute(options.languageRenderers));

	next();
}

register.attributes = {
	name: 'mwp-app-route',
	version: '1.0.0',
	dependencies: [
		'mwp-language', // provides `request.getPrefixedPath` and `request.getLanguage`
		'electrode-csrf-jwt', // sets CSRF jwt on initial request
	],
};
