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

	// tap into/create the mup-web database, with a `cache` store
	const idb = require('idb');
	const DB_NAME = 'mup-web';
	const DB_VERSION = 1;
	const CACHE_STORE_NAME = 'cache';
	const dbPromise = idb.open(
		DB_NAME,
		DB_VERSION,
		upgradeDB => {
			upgradeDB.createObjectStore(CACHE_STORE_NAME);
		}
	);
	return {
		get(key) {
			return dbPromise.then(db => {
				return db.transaction(CACHE_STORE_NAME)
					.objectStore(CACHE_STORE_NAME).get(key);
			});
		},
		set(key, val) {
			return dbPromise.then(db => {
				const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
				tx.objectStore(CACHE_STORE_NAME).put(val, key);
				return tx.complete;
			});
		},
		delete(key) {
			return dbPromise.then(db => {
				const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
				tx.objectStore(CACHE_STORE_NAME).delete(key);
				return tx.complete;
			});
		},
		clear() {
			return dbPromise.then(db => {
				const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
				tx.objectStore(CACHE_STORE_NAME).clear();
				return tx.complete;
			});
		},
	};
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

