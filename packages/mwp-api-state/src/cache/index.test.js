import {
	mockQuery,
	MOCK_RENDERPROPS,
	MOCK_API_RESULT,
} from 'meetup-web-mocks/lib/app';

import * as api from '../sync/apiActionCreators';

import { makeCache } from './util';
import { CACHE_CLEAR, CACHE_SUCCESS } from './cacheActionCreators';
import getCacheEpic from './';

const MOCK_QUERY = mockQuery(MOCK_RENDERPROPS);
const MOCK_SUCCESS_ACTION = api.success({
	query: api.get(MOCK_QUERY).payload[0],
	response: MOCK_API_RESULT[0],
});
const apiRequestAction = api.get(MOCK_QUERY);

const fakeStore = {
	getState() {
		return { api: {} };
	},
	dispatch() {},
	subscribe() {},
};

function makeCacheEpic() {
	return Promise.resolve(getCacheEpic(makeCache()));
}
function populateCacheEpic(CacheEpic) {
	// set the cache with API_SUCCESS
	return CacheEpic(MOCK_SUCCESS_ACTION, fakeStore).then(() => CacheEpic);
}

function clearCacheEpic(CacheEpic) {
	// clear the cache with CACHE_CLEAR
	return CacheEpic({ type: CACHE_CLEAR }, fakeStore).then(() => CacheEpic);
}

const testForEmptyCache = (action = apiRequestAction) => CacheEpic =>
	CacheEpic(action, fakeStore).then(actions => expect(actions).toHaveLength(0));

const testForPopulatedCache = (action = apiRequestAction) => CacheEpic =>
	CacheEpic(action, fakeStore).then(actions =>
		expect(actions.map(({ type }) => type)).toContain(CACHE_SUCCESS)
	);

describe('getCacheEpic', () => {
	it('does not pass through arbitrary actions', () =>
		getCacheEpic()({ type: 'asdf' }).then(actions =>
			expect(actions).toHaveLength(0)
		));
	it('does not emit CACHE_SUCCESS when no cache hit from API_REQ', () =>
		makeCacheEpic().then(testForEmptyCache()));

	it('emits CACHE_SUCCESS when there is a cache hit for API_REQ', () =>
		makeCacheEpic()
			.then(populateCacheEpic) // also indirectly testing for successful cache set on API_SUCCESS
			.then(testForPopulatedCache()));

	it('does not emit CACHE_SUCCESS after CACHE_CLEAR is dispatched', () =>
		makeCacheEpic()
			.then(populateCacheEpic)
			.then(clearCacheEpic)
			.then(testForEmptyCache()));
});
