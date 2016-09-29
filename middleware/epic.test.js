import fetch from 'node-fetch';
global.fetch = fetch;
import {
	middlewareDispatcher,
} from '../util/testUtils';
import {
	mockQuery,
	MOCK_API_RESULT,
	MOCK_APP_STATE,
	MOCK_RENDERPROPS,
	MOCK_ROUTES,
} from '../util/mocks/app';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as authActionCreators from '../actions/authActionCreators';
import * as cacheActionCreators from '../actions/cacheActionCreators';
import {
	makeCache,
	cacheWriter,
	cacheReader,
} from '../util/cacheUtils';
import {
	checkEnable,
} from '../epics/cache';
import getEpicMiddleware from './epic';

/**
 * The sync middleware needs to respond to particular actions by calling
 * an API endpoint and then triggering a syncing action asynchronously
 *
 * Middleware tests require a mock `dispatch` method and a mock `createStore`.
 * @see {@link http://redux.js.org/docs/recipes/WritingTests.html#middleware}
 *
 * @module SyncMiddlewareTest
 */
describe('SyncMiddleware', () => {
	const syncDispatcher = middlewareDispatcher(getEpicMiddleware(MOCK_ROUTES));
	beforeEach(function() {
		this.renderAction = {
			type: 'ARBITRARY',
			payload: '/'  // root location/path will query for member
		};
	});
	it('dispatches', function() {
		expect(syncDispatcher(MOCK_APP_STATE, this.renderAction))
			.toEqual(this.renderAction);  // end of dispatch chain is the action
	});
	it('dispatches locationSync with routing state on CONFIGURE_AUTH', function() {
		spyOn(syncActionCreators, 'locationSync');
		syncDispatcher(MOCK_APP_STATE, authActionCreators.configureAuth({}));
		jest.runAllTimers();
		expect(syncActionCreators.locationSync)
			.toHaveBeenCalledWith(MOCK_APP_STATE.routing.locationBeforeTransitions);
	});
});

describe('AuthMiddleware', () => {
	const authDispatcher = middlewareDispatcher(getEpicMiddleware(MOCK_ROUTES));
	beforeEach(function() {
		const MOCK_LOGIN_RESPONSE = {
			value: {
				member: {},
				oauth_token: 1234
			}
		};
		this.loginSuccessAction = authActionCreators.loginSuccess(MOCK_LOGIN_RESPONSE);
		this.logoutAction = authActionCreators.logoutRequest();
	});
	it('dispatches', function() {
		expect(authDispatcher(MOCK_APP_STATE, this.loginSuccessAction))
			.toEqual(this.loginSuccessAction);  // end of dispatch chain is the action
	});
	it('dispatches configureAuth on LOGIN_SUCCESS', function() {
		spyOn(authActionCreators, 'configureAuth');
		authDispatcher(MOCK_APP_STATE, this.loginSuccessAction);
		expect(authActionCreators.configureAuth).toHaveBeenCalled();
	});
	it('dispatches configureAuth on LOGIN_SUCCESS', function() {
		spyOn(authActionCreators, 'configureAuth');
		authDispatcher(MOCK_APP_STATE, this.loginSuccessAction);
		expect(authActionCreators.configureAuth).toHaveBeenCalled();
	});
	it('dispatches configureAuth on LOGOUT_REQUEST', function() {
		spyOn(authActionCreators, 'configureAuth');
		authDispatcher(MOCK_APP_STATE, this.logoutAction);
		expect(authActionCreators.configureAuth).toHaveBeenCalled();
	});
});

describe('CacheMiddleware', () => {
	const cacheDispatcher = middlewareDispatcher(getEpicMiddleware(MOCK_ROUTES));
	beforeEach(function() {
		this.MOCK_QUERY = mockQuery(MOCK_RENDERPROPS);
		this.apiSuccessAction = syncActionCreators.apiSuccess({
			queries: [this.MOCK_QUERY],
			responses: MOCK_API_RESULT
		});
		console.log = () => {};  // suppress expected irrelevant console output
	});
	it('dispatches', function() {
		expect(cacheDispatcher(MOCK_APP_STATE, this.apiSuccessAction))
			.toEqual(this.apiSuccessAction);  // end of dispatch chain is the action
	});
	it('creates a Promise-based cache', function() {
		const cache = makeCache();
		expect(cache.get).toEqual(jasmine.any(Function));
		expect(cache.get()).toEqual(jasmine.any(Promise));
		expect(cache.set).toEqual(jasmine.any(Function));
		expect(cache.set()).toEqual(jasmine.any(Promise));
		expect(cache.delete).toEqual(jasmine.any(Function));
		expect(cache.delete()).toEqual(jasmine.any(Promise));
	});
	it('sets and gets from cache', function(done) {
		const cache = makeCache();
		cache.set('foo', 'bar');
		cache.get('foo')
			.then(value => expect(value).toEqual('bar'))
			.then(() => {
				cache.set('foo', 'baz');
				cache.get('foo')
					.then(value => expect(value).toEqual('baz'))
					.then(done);
			});
	});
	it('deletes from cache', function(done) {
		const cache = makeCache();
		cache.set('foo', 'bar');
		cache.delete('foo');
		cache.get('foo')
			.then(value => expect(value).toBeUndefined())
			.catch(err => expect(err).toEqual(jasmine.any(Error)))
			.then(done);
	});

	it('cacheWriter writes to cache', function(done) {
		const cache = makeCache();
		const query = { foo: 'baz' };
		const response = 'bar';
		cacheWriter(cache)(query, response)
			.then(() => cache.get(JSON.stringify(query)))
			.then(cachedResponse => expect(cachedResponse).toEqual(response))
			.then(done);
	});

	it('cacheReader reads from cache and returns result with query', function(done) {
		const cache = makeCache();
		const requestCache = cacheReader(cache);
		const query = { foo: 'baz' };
		const nonCachedQuery = { bing: 'bong' };
		const response = 'bar';
		cacheWriter(cache)(query, response)
			.then(() => requestCache(query))
			.then(([ cachedQuery, cachedResponse ]) => {  // expecting two-element array response
				expect(cachedQuery).toEqual(query);
				expect(cachedResponse).toEqual(response);
			})
			.then(() => requestCache(nonCachedQuery))  // test with un-cached query
			.then(([ cachedQuery, cachedResponse ]) => {
				expect(cachedQuery).toEqual(nonCachedQuery);
				expect(cachedResponse).toBeNull();
			})
			.then(done);
	});
	it('does not call cacheSet when disabled', function() {
		const spyable = {
			checkEnable,
		};
		spyOn(spyable, 'checkEnable').and.callFake(() => false);
		// set up a fresh dispatcher and apiSuccessAction that will use the faked
		// checkEnable function
		const cacheDispatcher = getEpicMiddleware({});
		const apiSuccessAction = syncActionCreators.apiSuccess({
			queries: [this.MOCK_QUERY],
			responses: MOCK_API_RESULT
		});

		// test for cache actions in response to api actions
		spyOn(cacheActionCreators, 'cacheSet');
		cacheDispatcher(MOCK_APP_STATE, apiSuccessAction);
		expect(cacheActionCreators.cacheSet)
			.not.toHaveBeenCalled();

		const apiRequestAction = syncActionCreators.apiRequest([this.MOCK_QUERY]);
		spyOn(cacheActionCreators, 'cacheRequest');
		cacheDispatcher(MOCK_APP_STATE, apiRequestAction);
		expect(cacheActionCreators.cacheRequest).not.toHaveBeenCalled();
	});
});

