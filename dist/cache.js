module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2);


/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports) {

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	/**
	 * Provides a cache outside of Redux state that can optimistically update state
	 * before an asynchronous API call returns
	 *
	 * @module CacheMiddleware
	 */
	import Rx from 'rx';
	import { bindActionCreators } from 'redux';
	import { cacheSuccess, cacheRequest, cacheSet, cacheClear } from '../actions/cacheActionCreators';

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
			var _ret = function () {
				console.log('no IndexedDB caching available - fallback to plain object');
				var _data = {};
				return {
					v: {
						get: function get(key) {
							return key in _data ? Promise.resolve(_data[key]) : Promise.reject(new Error(key + ' not found'));
						},
						set: function set(key, val) {
							_data[key] = val;
							return Promise.resolve();
						},
						delete: function _delete(key) {
							delete _data[key];
							return Promise.resolve();
						},
						clear: function clear() {
							Object.keys(_data).forEach(function (key) {
								return delete _data[key];
							});
							return Promise.resolve();
						}
					}
				};
			}();

			if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
		}

		// tap into/create the mup-web database, with a `cache` store
		var idb = require('idb');
		var DB_NAME = 'mup-web';
		var DB_VERSION = 1;
		var CACHE_STORE_NAME = 'cache';
		var dbPromise = idb.open(DB_NAME, DB_VERSION, function (upgradeDB) {
			upgradeDB.createObjectStore(CACHE_STORE_NAME);
		});
		return {
			get: function get(key) {
				return dbPromise.then(function (db) {
					return db.transaction(CACHE_STORE_NAME).objectStore(CACHE_STORE_NAME).get(key);
				});
			},
			set: function set(key, val) {
				return dbPromise.then(function (db) {
					var tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
					tx.objectStore(CACHE_STORE_NAME).put(val, key);
					return tx.complete;
				});
			},
			delete: function _delete(key) {
				return dbPromise.then(function (db) {
					var tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
					tx.objectStore(CACHE_STORE_NAME).delete(key);
					return tx.complete;
				});
			},
			clear: function clear() {
				return dbPromise.then(function (db) {
					var tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
					tx.objectStore(CACHE_STORE_NAME).clear();
					return tx.complete;
				});
			}
		};
	}

	/**
	 * Generates a function that can read queries and return hits in the supplied cache
	 *
	 * @param {Object} cache the persistent cache containing query-able data
	 * @param {Object} query query for app data
	 * @return {Promise} resolves with cache hit, otherwise rejects
	 */
	export var cacheReader = function cacheReader(cache) {
		return function (query) {
			return cache.get(JSON.stringify(query)).then(function (response) {
				return [query, response];
			}).catch(function (err) {
				return [query, null];
			});
		};
	}; // errors don't matter - just return null

	/**
	 * Generates a function that can write query-response values into cache
	 *
	 * @param {Object} cache the persistent cache containing query-able data
	 * @param {Object} query query for app data
	 * @param {Object} response plain object API response for the query
	 * @return {Promise}
	 */
	export var cacheWriter = function cacheWriter(cache) {
		return function (query, response) {
			return cache.set(JSON.stringify(query), response);
		};
	};

	export function checkEnable() {
		if (typeof window !== 'undefined' && window.location) {
			var params = new URLSearchParams(window.location.search.slice(1));
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
	var CacheMiddleware = function CacheMiddleware(store) {

		if (!checkEnable()) {
			return function (next) {
				return function (action) {
					return next(action);
				};
			};
		}
		// get a cache, any cache (that conforms to the Promise-based API)
		var cache = makeCache();

		// get a function that can read from the cache for a specific query
		var readCache = cacheReader(cache);
		// get a function that can write to the cache for a specific query-response
		var writeCache = cacheWriter(cache);

		return function (next) {
			return function (action) {
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
					(function () {
						var dispatchCacheSet = bindActionCreators(cacheSet, store.dispatch);
						var _action$payload = action.payload;
						var queries = _action$payload.queries;
						var responses = _action$payload.responses;

						queries.forEach(function (query, i) {
							var response = responses[i];
							dispatchCacheSet(query, response);
						});
					})();
				}

				/**
	    * Observables are heavily used in CACHE_REQUEST because each query results in
	    * an async 'get' (Promise) from the Cache - all 'gets' happen in parallel and
	    * the results are collated into a single response object containing the cache
	    * hits.
	    */
				if (action.type === 'CACHE_REQUEST') {
					var dispatchCacheSuccess = bindActionCreators(cacheSuccess, store.dispatch);

					var cachedResponse$ = Rx.Observable.from(action.payload) // fan-out
					.flatMap(readCache) // look for a cache hit
					.filter(function (_ref) {
						var _ref2 = _slicedToArray(_ref, 2);

						var query = _ref2[0];
						var response = _ref2[1];
						return response;
					}) // ignore misses
					.reduce(function (acc, _ref3) {
						var _ref4 = _slicedToArray(_ref3, 2);

						var query = _ref4[0];
						var response = _ref4[1];
						// fan-in to create response
						acc.queries.push(query);
						acc.responses.push(response);
						return acc;
					}, { queries: [], responses: [] }) // empty response structure
					.filter(function (_ref5) {
						var queries = _ref5.queries;
						var responses = _ref5.responses;
						return queries.length;
					}); // only deliver if hits

					cachedResponse$.subscribe(dispatchCacheSuccess, function (err) {
						return console.log('Problem reading from cache', err);
					} // cache error is no-op
					);
				}

				/**
	    * CACHE_SET is a specific instruction to add a single query-response pair
	    * to the cache. Do it.
	    */
				if (action.type === 'CACHE_SET') {
					var _action$payload2 = action.payload;
					var query = _action$payload2.query;
					var response = _action$payload2.response;
					// this is async - technically values aren't immediately available

					writeCache(query, response);
				}

				if (action.type === 'CACHE_CLEAR') {
					cache.clear();
				}

				return next(action);
			};
		};
	};

	export default CacheMiddleware;

/***/ }
/******/ ]);