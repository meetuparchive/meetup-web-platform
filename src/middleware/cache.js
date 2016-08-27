/**
 * Provides a cache outside of Redux state that can optimistically update state
 * before an asynchronous API call returns
 *
 * @module CacheMiddleware
 */
import Rx from 'rx';
import { bindActionCreators } from 'redux';
import {
	cacheSuccess,
	cacheRequest,
	cacheSet,
	cacheClear,
} from '../actions/cacheActionCreators';

/**
 * This function performs feature sniffing to determine whether the preferred
 * IndexedDB cache is available, otherwise it falls back to a simple
 * plain-object-based cache that will only survive as long as the request.
 *
 * The cache object methods are thin wrappers around their IndexedDB
 * ObjectStore equivalents
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore}
 *
 * @returns {Object} an object with Promise-based `get`, `set`, `delete`, and
 * `clear` methods
 */
export function makeCache() {
	if (typeof window === 'undefined' || !window.indexedDB) {
		console.log('no IndexedDB caching available - fallback to plain object');
		const _data = {};
		return {
			get(key) {
				return key in _data ?
					Promise.resolve(_data[key]) :
					Promise.reject(new Error(`${key} not found`));
			},
			set(key, val) {
				_data[key] = val;
				return Promise.resolve();
			},
			delete(key) {
				delete _data[key];
				return Promise.resolve();
			},
			clear() {
				Object.keys(_data).forEach(key => delete _data[key]);
				return Promise.resolve();
			},
		};
	}

	// tap into/create the mup-web database, with a `cache` store
}

/**
 * Generates a function that can read queries and return hits in the supplied cache
 *
 * @param {Object} cache the persistent cache containing query-able data
 * @param {Object} query query for app data
 * @return {Promise} resolves with cache hit, otherwise rejects
 */
export const cacheReader = cache => query =>
	cache.get(JSON.stringify(query))
		.then(response => ([ query, response ]))
		.catch(err => ([ query, null ]));  // errors don't matter - just return null

/**
 * Generates a function that can write query-response values into cache
 *
 * @param {Object} cache the persistent cache containing query-able data
 * @param {Object} query query for app data
 * @param {Object} response plain object API response for the query
 * @return {Promise}
 */
export const cacheWriter = cache => (query, response) =>
	cache.set(JSON.stringify(query), response);

export function checkEnable() {
	if (typeof window !== 'undefined' && window.location) {
		const params = new URLSearchParams(window.location.search.slice(1));
		return !params.has('__nocache');
	}
	return true;
}

/**
 * The cache middleware triggers a 'set'/store action when new data is received
 * from the API (API_SUCCESS), and is queried when queries are sent to the API
 * (API_REQUEST). These events trigger cache-specific events, CACHE_SET and
 * CACHE_QUERY, which are then used to update the cache or update the
 * application state (CACHE_SUCCESS)
 *
 * @returns {Function} the curried state => action => next middleware function
 */
const CacheMiddleware = store => {

	if (!checkEnable()) {
		return next => action => next(action);
	}
	// get a cache, any cache (that conforms to the Promise-based API)
	const cache = makeCache();

	// get a function that can read from the cache for a specific query
	const readCache = cacheReader(cache);
	// get a function that can write to the cache for a specific query-response
	const writeCache = cacheWriter(cache);

	return next => action => {
		/**
		 * API_REQUEST means the application wants data described by the
		 * `queries` in the action payload - just forward those to the
		 * CACHE_REQUEST action and dispatch it
		 */
		if (action.type === 'API_REQUEST') {
			store.dispatch(cacheRequest(action.payload));
		}
		if (action.type === 'LOGOUT_REQUEST') {
			store.dispatch(cacheClear());
		}

		/**
		 * API_SUCCESS means there is fresh data ready to be stored - extract the
		 * queries and their responses, then dispatch `CACHE_SET` actions with each
		 * pair
		 */
		if (action.type === 'API_SUCCESS') {
			const dispatchCacheSet = bindActionCreators(cacheSet, store.dispatch);
			const { queries, responses } = action.payload;
			queries.forEach((query, i) => {
				const response = responses[i];
				dispatchCacheSet(query, response);
			});
		}

		/**
		 * Observables are heavily used in CACHE_REQUEST because each query results in
		 * an async 'get' (Promise) from the Cache - all 'gets' happen in parallel and
		 * the results are collated into a single response object containing the cache
		 * hits.
		 */
		if (action.type === 'CACHE_REQUEST') {
			const dispatchCacheSuccess = bindActionCreators(cacheSuccess, store.dispatch);

			const cachedResponse$ = Rx.Observable.from(action.payload) // fan-out
				.flatMap(readCache)                                      // look for a cache hit
				.filter(([ query, response ]) => response)               // ignore misses
				.reduce((acc, [ query, response ]) => {                  // fan-in to create response
					acc.queries.push(query);
					acc.responses.push(response);
					return acc;
				}, { queries: [], responses: [] })                       // empty response structure
				.filter(({ queries, responses }) => queries.length);     // only deliver if hits

			cachedResponse$.subscribe(
				dispatchCacheSuccess,
				err => console.log('Problem reading from cache', err)    // cache error is no-op
			);
		}

		/**
		 * CACHE_SET is a specific instruction to add a single query-response pair
		 * to the cache. Do it.
		 */
		if (action.type === 'CACHE_SET') {
			const { query, response } = action.payload;
			// this is async - technically values aren't immediately available
			writeCache(query, response);
		}

		if (action.type === 'CACHE_CLEAR') {
			cache.clear();
		}

		return next(action);
	};
};

export default CacheMiddleware;

