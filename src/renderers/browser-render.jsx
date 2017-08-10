// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import {
	getInitialState,
	getBrowserCreateStore,
} from '../util/createStoreBrowser';
import { getRouteResolver } from '../router/util';
import BrowserApp from '../render/components/BrowserApp';

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
	reducer: Reducer,
	middleware: Array<Object> = []
): Promise<AppProps> {
	const basename = window.APP_RUNTIME.baseUrl || '';
	const createStore = getBrowserCreateStore(routes, middleware, basename);
	const store = createStore(reducer, getInitialState(window.APP_RUNTIME));
	return getRouteResolver(routes, basename)(window.location).then(() => ({
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
	reducer: Reducer,
	middleware: Array<Object> = []
) {
	return (rootElId: string = 'outlet') => {
		resolveAppProps(routes, reducer, middleware).then(props => {
			ReactDOM.render(
				<BrowserApp {...props} />,
				document.getElementById(rootElId)
			);
			return props.store;
		});
	};
}

export default makeRenderer;
