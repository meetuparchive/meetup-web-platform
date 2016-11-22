import { ActionsObservable } from 'redux-observable';

import {
	mockQuery,
	MOCK_RENDERPROPS,
	MOCK_API_RESULT,
} from 'meetup-web-mocks/lib/app';

import {
	epicIgnoreAction
} from '../util/testUtils';

import {
	makeCache,
} from '../util/cacheUtils';

import getCacheEpic from './cache';
import * as syncActionCreators from '../actions/syncActionCreators';

const MOCK_QUERY = mockQuery(MOCK_RENDERPROPS);
const MOCK_SUCCESS_ACTION = syncActionCreators.apiSuccess({
	queries: [MOCK_QUERY],
	responses: MOCK_API_RESULT
});
const apiRequestAction = syncActionCreators.apiRequest([MOCK_QUERY]);

function makeCacheEpic() {
	return Promise.resolve(getCacheEpic(makeCache()));
}
function populateCacheEpic(CacheEpic) {
	// set the cache with API_SUCCESS
	const apiSuccessAction$ = ActionsObservable.of(MOCK_SUCCESS_ACTION);
	return CacheEpic(apiSuccessAction$)
		.toPromise()
		.then(() => CacheEpic);
}

function clearCacheEpic(CacheEpic) {
	// clear the cache with CACHE_CLEAR
	const clearAction$ = ActionsObservable.of({ type: 'CACHE_CLEAR' });
	return CacheEpic(clearAction$)
		.toPromise()
		.then(() => CacheEpic);
}

const testForEmptyCache = (action=apiRequestAction) => CacheEpic =>
	epicIgnoreAction(CacheEpic, action)();

const testForPopulatedCache = (action=apiRequestAction) => CacheEpic => {
	const testAction$ = ActionsObservable.of(action);
	return CacheEpic(testAction$)
		.do(action => expect(action.type).toEqual('CACHE_SUCCESS'))
		.toPromise();
};

describe('getCacheEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(getCacheEpic()));
	it('does not emit CACHE_SUCCESS when no cache hit from API_REQUEST', () =>
		makeCacheEpic().then(testForEmptyCache())
	);

	it('emits CACHE_SUCCESS when there is a cache hit for API_REQUEST', () =>
		makeCacheEpic()
			.then(populateCacheEpic)  // also indirectly testing for successful cache set on API_SUCCESS
			.then(testForPopulatedCache())
	);

	it('does not emit CACHE_SUCCESS after CACHE_CLEAR is dispatched', () =>
		makeCacheEpic()
			.then(populateCacheEpic)
			.then(clearCacheEpic)
			.then(testForEmptyCache())
	);
});

