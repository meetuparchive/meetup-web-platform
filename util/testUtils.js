import { Observable } from 'rxjs/Observable';
import Hapi from 'hapi';
import Cookie from 'tough-cookie';
import TestUtils from 'react-addons-test-utils';

export function findComponentsWithType(tree, typeString) {
	return TestUtils.findAllInRenderedTree(
		tree,
		(component) => component && component.constructor.name === typeString
	);
}

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

export const parseCookieHeader = (cookieHeader) => {
	const cookies = (cookieHeader instanceof Array) ?
		cookieHeader.map(Cookie.parse) :
		[Cookie.parse(cookieHeader)];

	return cookies.reduce(
		(acc, cookie) => ({ ...acc, [cookie.key]: cookie.value }),
		{}
	);

};

export function getServer() {
	const server = new Hapi.Server();
	server.connection();

	// mock the anonAuthPlugin
	server.decorate(
		'request',
		'authorize',
		request => () => Observable.of(request),
		{ apply: true }
	);
	return server;
}


