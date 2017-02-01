import url from 'url';
import { createStore } from 'redux';
import {
	clickTrackEnhancer,
	getPlatformMiddlewareEnhancer,
	getBrowserCreateStore,
	getServerCreateStore,
	mergeRawCookies,
	serverFetchQueries,
} from './createStore';

import * as fetchUtils from './fetchUtils';
const MOCK_ROUTES = {};
const IDENTITY_REDUCER = state => state;
const MOCK_HAPI_REQUEST = {
	state: {}
};

const serverRequest = {
	state: {
		__internal_foo: 'bar',
		bar: 'baz',  // ignored because it doesn't start with __internal_
	},
	url: url.parse('http://example.com'),
	raw: {
		req: {
			headers: {
				cookie: 'foo=bar',
			},
		},
	},
};

function testCreateStore(createStoreFn) {
	it('creates a store with store functions', () => {
		const basicStore = createStoreFn(IDENTITY_REDUCER);
		expect(basicStore.getState).toEqual(jasmine.any(Function));
		expect(basicStore.dispatch).toEqual(jasmine.any(Function));
	});
	it('creates a store with supplied initialState', (done) => {
		const initialState = { foo: 'bar' };
		const basicStore = createStoreFn(IDENTITY_REDUCER, initialState);
		basicStore.subscribe(() => {
			expect(basicStore.getState()).toEqual(initialState);
			done();
		});
		basicStore.dispatch({ type: 'dummy' });
	});
}

describe('clickTrackEnhancer', () => {
	global.window = {};
	global.Event = function() {};
	global.document = {
		body: {
			addEventListener() {},
		},
	};
	it('adds event listeners to document.body', () => {
		spyOn(global.document.body, 'addEventListener');
		const enhancedCreateStore = clickTrackEnhancer(createStore);
		enhancedCreateStore(IDENTITY_REDUCER);
		const args = global.document.body.addEventListener.calls.allArgs();
		const eventNames = args.map(a => a[0]);
		const handlers = args.map(a => a[1]);

		expect(eventNames).toEqual(['click', 'change']);
		expect(handlers.every(h => h instanceof Function)).toBe(true);
	});
});
describe('getPlatformMiddlewareEnhancer', () => {
	it('applies custom middleware', () => {
		// To determine whether custom middleware is being applied, this test
		// simply spies on the middleware function to see if it's called during
		// store creation

		const spyable = {
			middleware: store => next => action => next(action)
		};
		spyOn(spyable, 'middleware').and.callThrough();
		const platformMiddlewareEnhancer = getPlatformMiddlewareEnhancer(MOCK_ROUTES, [spyable.middleware]);
		const enhancedCreateStore = platformMiddlewareEnhancer(createStore);
		enhancedCreateStore(IDENTITY_REDUCER);
		expect(spyable.middleware).toHaveBeenCalled();
	});
});

describe('getBrowserCreateStore', () => {
	testCreateStore(getBrowserCreateStore(MOCK_ROUTES, []));
});

describe('getServerCreateStore', () => {
	testCreateStore(getServerCreateStore(MOCK_ROUTES, [], MOCK_HAPI_REQUEST));
});

describe('mergeRawCookies', () => {
	it('combines request.state cookies with a `__internal_` prefix with the raw request cookie header string', () => {
		expect(mergeRawCookies(serverRequest)).toEqual('foo=bar; __internal_foo=bar');
	});
	it('works when request contains no cookies', () => {
		expect(mergeRawCookies({
			...serverRequest,
			raw: { req: { headers: {} } },
		})).toEqual('__internal_foo=bar');
	});
});

describe('serverFetchQueries', () => {
	it('calls fetchQueries with modified options', () => {
		spyOn(fetchUtils, 'fetchQueries');
		const apiUrl = 'http://example.com';
		const options = {};
		serverFetchQueries(serverRequest)(apiUrl, options);
		expect(fetchUtils.fetchQueries).toHaveBeenCalledWith(
			apiUrl,
			jasmine.any(Object)
		);
	});
	it('defaults referer to request.url.pathname', () => {
		spyOn(fetchUtils, 'fetchQueries');
		const apiUrl = 'http://example.com';
		const options = {};
		serverFetchQueries(serverRequest)(apiUrl, options);
		const callArgs = fetchUtils.fetchQueries.calls.mostRecent().args;
		expect(callArgs[1].headers.referer).toEqual(serverRequest.url.pathname);
	});
	it('appends request headers to option headers', () => {
		spyOn(fetchUtils, 'fetchQueries');
		const apiUrl = 'http://example.com';
		const options = {
			headers: {
				cookie: 'bim=bam',
			},
		};
		serverFetchQueries(serverRequest)(apiUrl, options);
		const callArgs = fetchUtils.fetchQueries.calls.mostRecent().args;
		expect(callArgs[1].headers.cookie).toEqual('bim=bam; foo=bar; __internal_foo=bar');
	});
});

