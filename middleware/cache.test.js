import {
	createFakeStore,
	middlewareDispatcher,
} from '../util/testUtils';
import {
	mockQuery,
	MOCK_APP_STATE,
	MOCK_API_RESULT,
	MOCK_RENDERPROPS,
} from '../util/mocks/app';
import * as cacheActionCreators from '../actions/cacheActionCreators';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as authActionCreators from '../actions/authActionCreators';
import CacheMiddleware, {
	makeCache,
	cacheWriter,
	cacheReader,
	checkEnable,
} from './cache' ;

/**
 * Middleware tests require a mock `dispatch` method and a mock `createStore`.
 * @see {@link http://redux.js.org/docs/recipes/WritingTests.html#middleware}
 *
 * @module CacheMiddlewareTest
 */
describe('CacheMiddleware', () => {
	const cacheDispatcher = middlewareDispatcher(CacheMiddleware);
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
	it('calls CACHE_SET for API_SUCCESS', function() {
		spyOn(cacheActionCreators, 'cacheSet');
		cacheDispatcher(MOCK_APP_STATE, this.apiSuccessAction);
		expect(cacheActionCreators.cacheSet)
			.toHaveBeenCalled();
	});
	it('calls CACHE_REQUEST for API_REQUEST', function() {
		spyOn(cacheActionCreators, 'cacheRequest');
		const apiRequestAction = syncActionCreators.apiRequest([this.MOCK_QUERY]);
		cacheDispatcher(MOCK_APP_STATE, apiRequestAction);
		expect(cacheActionCreators.cacheRequest).toHaveBeenCalled();
	});
	it('calls CACHE_SUCCESS with expected queries and responses from CACHE_SET => CACHE_REQUEST sequence', function(done) {
		spyOn(cacheActionCreators, 'cacheSuccess');
		const cacheSetAction = cacheActionCreators.cacheSet(this.MOCK_QUERY, MOCK_API_RESULT[0]);
		const cacheRequestAction = cacheActionCreators.cacheRequest([this.MOCK_QUERY]);
		const dispatch = CacheMiddleware(createFakeStore({}))(() => {});
		dispatch(cacheSetAction);
		dispatch(cacheRequestAction);
		jest.useRealTimers();
		setTimeout(() => {
			const expectedResults = { queries: [this.MOCK_QUERY], responses: MOCK_API_RESULT };
			expect(cacheActionCreators.cacheSuccess).toHaveBeenCalledWith(expectedResults);
			done();
		}, 0);
	});
	it('does not call cacheSet when disabled', function() {
		const spyable = {
			checkEnable,
		};
		spyOn(spyable, 'checkEnable').and.callFake(() => false);
		// set up a fresh dispatcher and apiSuccessAction that will use the faked
		// checkEnable function
		const CacheMiddleware = require('./cache').default;
		const cacheDispatcher = middlewareDispatcher(CacheMiddleware);
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
	it('calls CACHE_CLEAR for LOGOUT_REQUEST', function() {
		spyOn(cacheActionCreators, 'cacheClear');
		const logoutRequestAction = authActionCreators.logoutRequest();
		cacheDispatcher(MOCK_APP_STATE, logoutRequestAction);
		expect(cacheActionCreators.cacheClear)
			.toHaveBeenCalled();
	});
	it('CACHE_SET => CACHE_CLEAR => CACHE_REQUEST does not fire CACHE_SUCCESS (no hits)', function(done) {
		spyOn(cacheActionCreators, 'cacheSuccess');
		const cacheSetAction = cacheActionCreators.cacheSet(this.MOCK_QUERY, MOCK_API_RESULT[0]);
		const cacheClearAction = cacheActionCreators.cacheClear();
		const cacheRequestAction = cacheActionCreators.cacheRequest([this.MOCK_QUERY]);
		const dispatch = CacheMiddleware(createFakeStore({}))(() => {});
		jest.useRealTimers();
		dispatch(cacheSetAction);
		setTimeout(() => {
			dispatch(cacheClearAction);
		}, 10);
		setTimeout(() => {
			dispatch(cacheRequestAction);
		}, 100);
		setTimeout(() => {
			expect(cacheActionCreators.cacheSuccess).not.toHaveBeenCalled();
			done();
		}, 1000);
	});
});

