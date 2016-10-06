import { Observable } from 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import Hapi from 'hapi';
import Cookie from 'tough-cookie';
import TestUtils from 'react-addons-test-utils';

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
	return server;
};

export const epicIgnoreArbitrary = epic => done => {
	const arbitraryAction = {
		type: 'ARBITRARY',
		payload: '/'  // root location/path will query for member
	};
	const action$ = ActionsObservable.of(arbitraryAction);
	const epic$ = epic(action$);
	const spyable = {
		notCalled: () => {}
	};
	spyOn(spyable, 'notCalled');
	epic$.subscribe(
		spyable.notCalled,
		null,
		() => {
			expect(spyable.notCalled).not.toHaveBeenCalled();
			done();
		}
	);
};
