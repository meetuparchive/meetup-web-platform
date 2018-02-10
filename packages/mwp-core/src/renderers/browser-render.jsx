// @flow
import type { Reducer } from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { getInitialState, getBrowserCreateStore } from 'mwp-store/lib/browser';
import { getRouteResolver } from 'mwp-router/lib/util';
import BrowserApp from 'mwp-app-render/lib/components/BrowserApp';

/**
 * @module browser-render
 */

type AppProps = {
	routes: Array<PlatformRoute>,
	store: Object,
	basename: string,
};

/**
 * Async resolver of the props needed for `BrowserApp`:
 * { routes, store, basename }
 */
export function resolveAppProps(
	routes: Array<PlatformRoute>,
	reducer: Reducer<MWPState, FluxStandardAction>,
	middleware: Array<Object> = []
): Promise<AppProps> {
	const basename = window.APP_RUNTIME.basename || '';
	const resolveRoutes = getRouteResolver(routes, basename);
	const createStore = getBrowserCreateStore(resolveRoutes, middleware);
	const store = createStore(reducer, getInitialState(window.APP_RUNTIME));
	return resolveRoutes(window.location).then(() => ({
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
