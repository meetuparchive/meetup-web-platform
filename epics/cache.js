/**
 * Provides a cache outside of Redux state that can optimistically update state
 * before an asynchronous API call returns
 *
 * @module CacheMiddleware
 */
import Rx from 'rxjs';
import { combineEpics } from 'redux-observable';
import {
	cacheSuccess,
} from '../actions/cacheActionCreators';

import {
	makeCache,
	cacheReader,
	cacheWriter,
} from '../util/cacheUtils';


export function checkEnable() {
	if (typeof window !== 'undefined' && window.location) {
		const params = new URLSearchParams(window.location.search.slice(1));
		return !params.has('__nocache');
	}
	return true;
}

// get a cache, any cache (that conforms to the Promise-based API)
export const cache = makeCache();

// get a function that can read from the cache for a specific query
const readCache = cacheReader(cache);
// get a function that can write to the cache for a specific query-response
const writeCache = cacheWriter(cache);

/**
 * Listen for any action that should clear cached state
 *
 * Note that this will clear the cache without emitting an action
 */
export const cacheClearEpic = action$ =>
	action$.ofType('LOGOUT_REQUEST', 'CACHE_CLEAR')
		.flatMap(() => cache.clear())  // wait for cache to clear before continuing
		.ignoreElements();

/**
 * Listen for any action that should set cached state with a
 * `{ queries, responses }` payload
 *
 * API_SUCCESS means there is fresh data ready to be stored - extract the
 * queries and their responses, then dispatch `CACHE_SET` actions with each
 * pair
 *
 * Not that this will set the cache without emitting an action
 */
export const cacheSetEpic = action$ =>
	action$.ofType('API_SUCCESS', 'CACHE_SET')
		.flatMap(({ payload: { queries, responses } }) =>
			Rx.Observable.from(queries).zip(Rx.Observable.from(responses))
		)
		.flatMap(([ query, response ]) => writeCache(query, response))
		.ignoreElements();

/**
 * Listen for any action that should query the cache using a payload of queries
 *
 * Observables are heavily used in CACHE_REQUEST because each query results in
 * an async 'get' (Promise) from the Cache - all 'gets' happen in parallel and
 * the results are collated into a single response object containing the cache
 * hits.
 */
export const cacheQueryEpic = action$ =>
	action$.ofType('API_REQUEST')
		.flatMap(({ payload }) => Rx.Observable.from(payload))  // fan out
		.flatMap(readCache)                          // look for a cache hit
		.filter(([ query, response ]) => response)   // ignore misses
		.reduce((acc, [ query, response ]) => ({      // fan-in to create response
			queries: [ ...acc.queries, query ],
			responses: [ ...acc.responses, response ],
		}), { queries: [], responses: [] })           // empty response structure
		.filter(cacheResponse => cacheResponse.responses.length)
		.map(cacheSuccess);

const cacheEpic = checkEnable() ? combineEpics(
	cacheClearEpic,
	cacheSetEpic,
	cacheQueryEpic
) : action$ => action$.ignoreElements();

export default cacheEpic;

