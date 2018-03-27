// @flow
/**
 * This function performs feature sniffing to determine whether the preferred
 * IndexedDB cache is available, otherwise it falls back to a simple
 * plain-object-based cache that will only survive as long as the request.
 *
 * The cache object methods are thin wrappers around their IndexedDB
 * ObjectStore equivalents
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore}
 */
type Cache = {
	get: string => Promise<QueryResponse>,
	set: (string, QueryResponse) => Promise<true>,
	delete: string => Promise<true>,
	clear: () => Promise<true>,
};
export function makeCache(): Cache {
	if (typeof window === 'undefined' || !window.indexedDB) {
		const _data = {};
		return {
			get(key) {
				return Promise.resolve(_data[key]);
			},
			set(key, val) {
				_data[key] = val;
				return Promise.resolve(true);
			},
			delete(key) {
				delete _data[key];
				return Promise.resolve(true);
			},
			clear() {
				Object.keys(_data).forEach(key => delete _data[key]);
				return Promise.resolve(true);
			},
		};
	}

	return require('idb-keyval');
}

const makeKey = (memberId: string, query: Query) =>
	`${memberId}${JSON.stringify(query)}`;

/**
 * Generates a function that can read queries and return hits in the supplied cache
 */
export const cacheReader = (cache: Cache, memberId: string) => (
	query: Query
): Promise<QueryState> =>
	cache
		.get(makeKey(memberId, query))
		.then((response: QueryResponse) => ({ query, response }))
		.catch(err => ({ query, response: null })); // errors don't matter - just return null

/**
 * Generates a function that can write query-response values into cache
 *
 * It will ignore non-GET responses and any responses to queries that have
 * opted-out of caching with `query.meta.noCache`
 */
export const cacheWriter = (cache: Cache, memberId: string) => (
	query: Query,
	response: QueryResponse
): Promise<boolean> => {
	const method = (query.meta || {}).method || 'get';
	if (method.toLowerCase() !== 'get' || (query.meta && query.meta.noCache)) {
		// skip cache writing
		return Promise.resolve(true);
	}
	return cache.set(makeKey(memberId, query), response);
};
