import React from 'react';
import { Observable } from 'rxjs';
import { ActionsObservable } from 'redux-observable';
import Hapi from 'hapi';
import Cookie from 'tough-cookie';
import TestUtils from 'react-addons-test-utils';
import RouterContext from 'react-router/lib/RouterContext';
import match from 'react-router/lib/match';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import {
	MOCK_MEANINGLESS_ACTION,
	MOCK_APP_STATE
} from './mocks/app';

export const findComponentsWithType = (tree, typeString) =>
	TestUtils.findAllInRenderedTree(
		tree,
		(component) => component && component.constructor.name === typeString
	);

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

export const middlewareDispatcher = middleware => (storeData, action) => {
	let dispatched = null;
	const dispatch = middleware(createFakeStore(storeData))(actionAttempt => dispatched = actionAttempt);
	dispatch(action);
	return dispatched;
};

export const parseCookieHeader = cookieHeader => {
	const cookies = (cookieHeader instanceof Array) ?
		cookieHeader.map(Cookie.parse) :
		[Cookie.parse(cookieHeader)];

	return cookies.reduce(
		(acc, cookie) => ({ ...acc, [cookie.key]: cookie.value }),
		{}
	);

};

export const getServer = connection => {
	const server = new Hapi.Server();
	server.connection(connection);

	// mock the anonAuthPlugin
	server.decorate(
		'request',
		'authorize',
		request => () => Observable.of(request),
		{ apply: true }
	);
	server.decorate('reply', 'track', () => ({}));
	return server;
};

export const epicIgnoreAction = (epic, action=MOCK_MEANINGLESS_ACTION, store=createFakeStore(MOCK_APP_STATE)) => () => {
	const spyable = {
		notCalled: () => {}
	};
	spyOn(spyable, 'notCalled');
	const action$ = ActionsObservable.of(action);
	return epic(action$, store)
		.do(spyable.notCalled, null, expect(spyable.notCalled).not.toHaveBeenCalled())
		.toPromise();
};

/**
 * Curry a function that takes a set of React Router routes and a location to
 * render, and return a Promise that resolves with the rendered React app
 *
 * @example
 * ```
 * const renderLocation = routeRenderer(routes);
 * renderLocation('/').then(app => ...);
 * renderLocation('/foo').then(app => ...);
 * ```
 */
export const routeRenderer = routes => (location, state=MOCK_APP_STATE) =>
	new Promise((resolve, reject) =>
		match({ location, routes }, (err, redirectLocation, renderProps) => {
			const FAKE_STORE = createFakeStore(state);
			const app = TestUtils.renderIntoDocument(
				<IntlProvider locale='en'>
					<Provider store={FAKE_STORE}>
						<RouterContext {...renderProps} />
					</Provider>
				</IntlProvider>
			);
			resolve(app);
		})
	);

