// @flow
import type { Reducer } from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { getInitialState, getBrowserCreateStore } from 'mwp-store/lib/browser';
import { getFindMatches } from 'mwp-router/lib/util';
import BrowserApp from 'mwp-app-render/lib/components/BrowserApp';

/**
 * @module browser-render
 */

type AppProps = {
	routes: Array<PlatformRoute>,
	store: Object,
	basename: string,
};

/*
 * Ensures that all async parts of the app that are needed for initial render
 * are downloaded before returning
 */
export function resolveAppProps(
	routes: Array<PlatformRoute>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Object> = []
): Promise<AppProps> {
	const basename = window.APP_RUNTIME.basename || '';
	const findMatches = getFindMatches(routes, basename);
	const createStore = getBrowserCreateStore(findMatches, middleware);
	const store = createStore(reducer, getInitialState(window.APP_RUNTIME));

	// find the matched routes, and then resolve their components - mutate
	// the route object so that the overall `routes` object contains
	// resolved `component` properties for the current location
	const resolveComponents = (): Promise<void> => {
		// get an array of matched routes
		const matchedRoutes = findMatches(window.location);
		// resolve components in parallel (AJAX chunk requests)
		return Promise.all(
			matchedRoutes.map(matchedRoute => {
				if (matchedRoute.route.getComponent) {
					return matchedRoute.route.getComponent();
				}
				return Promise.resolve(matchedRoute.route.component);
			})
		).then(components => {
			// mutate route objects in place
			matchedRoutes.forEach((matchedRoute, i) => {
				matchedRoute.route.component = components[i];
			});
		});
	};

	return resolveComponents().then(() => ({
		routes,
		store,
		basename,
	}));
}

/**
 * This function creates a 'renderer', which is just a function that, when
 * called, will call ReactDOM.render() to render the application
 *
 * The routes, reducer, and app-specific middleware are provided by the
 * application - everything else is general to the meetup web platform
 *
 * @deprecated see CHANGELOG v2.4
 */
function makeRenderer(
	routes: Array<PlatformRoute>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Object> = []
) {
	return (rootElId: string = 'outlet') => {
		const rootEl = document.getElementById(rootElId);
		if (!rootEl) {
			throw new Error(`React root element ${rootElId} does not exist`);
		}
		resolveAppProps(routes, reducer, middleware).then(props => {
			ReactDOM.render(<BrowserApp {...props} />, rootEl);
			return props.store;
		});
	};
}

export default makeRenderer;
