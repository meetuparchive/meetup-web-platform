import Hapi from 'hapi';
import Cookie from 'tough-cookie';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import { ActionsObservable } from 'redux-observable';

import {
	MOCK_MEANINGLESS_ACTION,
	MOCK_APP_STATE,
} from 'meetup-web-mocks/lib/app';
import appConfig from './config';

export const MOCK_LOGGER = {
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

export const middlewareDispatcher = middleware => (storeData, action) => {
	let dispatched = null;
	const dispatch = middleware(createFakeStore(storeData))(
		actionAttempt => (dispatched = actionAttempt)
	);
	dispatch(action);
	return dispatched;
};

export const parseCookieHeader = cookieHeader => {
	const cookies =
		cookieHeader instanceof Array
			? cookieHeader.map(Cookie.parse)
			: [Cookie.parse(cookieHeader)];

	return cookies.reduce(
		(acc, cookie) => ({ ...acc, [cookie.key]: cookie.value }),
		{}
	);
};

export const getServer = () => {
	const config = { ...appConfig, supportedLangs: ['en-US'] };
	const server = new Hapi.Server();
	server.connection({ port: 0 });
	server.app = {
		logger: MOCK_LOGGER,
	};
	server.settings.app = config;
	server.plugins = {
		'api-proxy': {
			duotoneUrls: [],
		},
	};

	// mock the anonAuthPlugin
	server.decorate(
		'request',
		'authorize',
		request => () => Observable.of(request),
		{ apply: true }
	);
	server.decorate('request', 'trackActivity', () => ({}));
	server.decorate('request', 'getLangPrefixPath', () => '/');
	server.decorate('request', 'getLanguage', () => 'en-US');
	server.logger = () => MOCK_LOGGER;
	server.ext('onPreHandler', (request, reply) => {
		request.plugins.tracking = {};
		reply.continue();
	});
	return server;
};

export const epicIgnoreAction = (
	epic,
	action = MOCK_MEANINGLESS_ACTION,
	store = createFakeStore(MOCK_APP_STATE)
) => () => {
	const spyable = {
		notCalled: () => {},
	};
	spyOn(spyable, 'notCalled');
	const action$ = ActionsObservable.of(action);
	return epic(action$, store)
		.do(
			spyable.notCalled,
			null,
			expect(spyable.notCalled).not.toHaveBeenCalled()
		)
		.toPromise();
};

const IDENTITY_REDUCER = state => state;
export function testCreateStore(createStoreFn) {
	it('creates a store with store functions', () => {
		const basicStore = createStoreFn(IDENTITY_REDUCER);
		expect(basicStore.getState).toEqual(jasmine.any(Function));
		expect(basicStore.dispatch).toEqual(jasmine.any(Function));
	});
	it('creates a store with supplied initialState', done => {
		const initialState = { foo: 'bar' };
		const basicStore = createStoreFn(IDENTITY_REDUCER, initialState);
		basicStore.subscribe(() => {
			expect(basicStore.getState()).toEqual(initialState);
			done();
		});
		basicStore.dispatch({ type: 'dummy' });
	});
}
