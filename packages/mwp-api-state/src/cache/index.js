/**
 * Provides a cache outside of Redux state that can optimistically update state
 * before an asynchronous API call returns
 *
 * @module CacheMiddleware
 */
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/zip';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/reduce';
import 'rxjs/add/operator/ignoreElements';
import 'rxjs/add/operator/mergeMap';
import { combineEpics } from 'redux-observable';
import { API_REQ, API_RESP_SUCCESS } from '../sync/apiActionCreators';
import { CACHE_CLEAR, CACHE_SET, cacheSuccess } from './cacheActionCreators';

import { makeCache, cacheReader, cacheWriter } from './util';

export function checkEnable() {
	if (typeof window !== 'undefined' && window.location) {
		const currentUrl = new URL(window.location.href);
		return !currentUrl.searchParams.has('__nocache');
	}
	return true;
}

/**
 * Listen for any action that should clear cached state
 *
 * Note that this will clear the cache without emitting an action
 */
export const cacheClearEpic = cache => action$ =>
	action$
		.ofType(CACHE_CLEAR)
		.mergeMap(() => cache.clear()) // wait for cache to clear before continuing
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
export const cacheSetEpic = cache => action$ =>
	action$
		.ofType(API_RESP_SUCCESS, CACHE_SET)
		.mergeMap(({ payload: { query, response } }) =>
			cacheWriter(cache)(query, response)
		)
		.ignoreElements();

/**
 * Listen for any action that should query the cache using a payload of queries
 *
 * Observables are heavily used in CACHE_REQUEST because each query results in
 * an async 'get' (Promise) from the Cache - all 'gets' happen in parallel and
 * the results are collated into a single response object containing the cache
 * hits.
 */
export const cacheQueryEpic = cache => action$ =>
	action$
		.ofType(API_REQ)
		.mergeMap(
			({ payload }) =>
				Observable.from(payload) // fan out
					.mergeMap(cacheReader(cache)) // look for a cache hit
					.filter(({ query, response }) => response) // ignore misses
		)
		.map(cacheSuccess);

const getCacheEpic = (cache = makeCache()) =>
	checkEnable()
		? combineEpics(
				cacheClearEpic(cache),
				cacheSetEpic(cache),
				cacheQueryEpic(cache)
			)
		: action$ => action$.ignoreElements();

export default getCacheEpic;
