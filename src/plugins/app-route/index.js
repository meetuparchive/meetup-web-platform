// @flow
import getRoute from './route';

type LanguageRenderer$ = (
	request: HapiRequest
) => Observable<{
	redirect: {
		url: string,
		permanent?: boolean,
	},
	statusCode?: ?number,
	result?: string,
}>;

export default function register(
	server: Object,
	options: { languageRenderers: { [string]: LanguageRenderer$ } },
	next: () => void
) {
	/*
	 * Route for service worker script at top-level path. Depends on `Inert`
	 * `path` must match client `serviceWorker.register` call - MWP provides this
	 * in the `<ServiceWorker>` component
	 */
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
