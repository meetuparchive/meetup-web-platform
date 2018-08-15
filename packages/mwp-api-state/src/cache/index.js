/**
 * Provides a cache outside of Redux state that can optimistically update state
 * before an asynchronous API call returns
 *
 * @module CacheMiddleware
 */
import { API_REQ, API_RESP_SUCCESS } from '../sync/apiActionCreators';
import { CACHE_CLEAR, CACHE_SET, cacheSuccess } from './cacheActionCreators';

import { makeCache, cacheReader, cacheWriter } from './util';

export function checkEnable() {
	if (typeof window !== 'undefined' && window.location) {
		const { searchParams } = new URL(window.location.href);
		return !searchParams || !searchParams.has('__nocache');
	}
	return true;
}

/**
 * Listen for any action that should clear cached state
 *
 * Note that this will clear the cache without emitting an action
 */
export const cacheClearEpic = cache => action => {
	if (action.type !== CACHE_CLEAR) {
		return Promise.resolve([]);
	}
	return cache.clear().then(() => []);
};

const getMemberId = state =>
	(((state.api.self || {}).value || {}).id || 0).toString();

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
export const cacheSetEpic = cache => (action, store) => {
	if (![API_RESP_SUCCESS, CACHE_SET].some(type => action.type === type)) {
		return Promise.resolve([]);
	}
	const { payload: { query, response } } = action;
	const writeCache = cacheWriter(cache, getMemberId(store.getState()));
	return writeCache(query, response).then(() => []);
};

/**
 * Listen for any action that should query the cache using a payload of queries
 *
 * Observables are heavily used in CACHE_REQUEST because each query results in
 * an async 'get' (Promise) from the Cache - all 'gets' happen in parallel and
 * the results are collated into a single response object containing the cache
 * hits.
 */
export const cacheQueryEpic = cache => (action, store) => {
	if (action.type !== API_REQ) {
		return Promise.resolve([]);
	}
	const { payload: queries } = action;
	const readCache = cacheReader(cache, getMemberId(store.getState()));
	return Promise.all(queries.map(readCache)) // read cache for all queries
		.then(responses => responses.filter(({ query, response }) => response)) // filter out the misses
		.then(hits => hits.map(cacheSuccess)); // map the hits onto cacheSuccess actions
};

export default (cache = makeCache()) =>
	checkEnable()
		? [cacheClearEpic(cache), cacheSetEpic(cache), cacheQueryEpic(cache)]
		: [action => Promise.resolve([])];
