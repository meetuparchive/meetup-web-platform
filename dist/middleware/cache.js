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
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 41);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports) {

eval("module.exports = require(\"rx\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"rx\"\n// module id = 0\n// module chunks = 0 1 2 3 4 7\n\n//# sourceURL=webpack:///external_%22rx%22?");

/***/ },

/***/ 1:
/***/ function(module, exports) {

eval("module.exports = require(\"redux\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"redux\"\n// module id = 1\n// module chunks = 0 1 3 4 5\n\n//# sourceURL=webpack:///external_%22redux%22?");

/***/ },

/***/ 14:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n\tvalue: true\n});\nexports.cacheWriter = exports.cacheReader = undefined;\n\nvar _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i[\"return\"]) _i[\"return\"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError(\"Invalid attempt to destructure non-iterable instance\"); } }; }();\n\nvar _typeof = typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol ? \"symbol\" : typeof obj; }; /**\n                                                                                                                                                                                                                                                   * Provides a cache outside of Redux state that can optimistically update state\n                                                                                                                                                                                                                                                   * before an asynchronous API call returns\n                                                                                                                                                                                                                                                   *\n                                                                                                                                                                                                                                                   * @module CacheMiddleware\n                                                                                                                                                                                                                                                   */\n\n\nexports.makeCache = makeCache;\nexports.checkEnable = checkEnable;\n\nvar _rx = __webpack_require__(0);\n\nvar _rx2 = _interopRequireDefault(_rx);\n\nvar _redux = __webpack_require__(1);\n\nvar _cacheActionCreators = __webpack_require__(20);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\n/**\n * This function performs feature sniffing to determine whether the preferred\n * IndexedDB cache is available, otherwise it falls back to a simple\n * plain-object-based cache that will only survive as long as the request.\n *\n * The cache object methods are thin wrappers around their IndexedDB\n * ObjectStore equivalents\n *\n * {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore}\n *\n * @returns {Object} an object with Promise-based `get`, `set`, `delete`, and\n * `clear` methods\n */\nfunction makeCache() {\n\tif (typeof window === 'undefined' || !window.indexedDB) {\n\t\tvar _ret = function () {\n\t\t\tconsole.log('no IndexedDB caching available - fallback to plain object');\n\t\t\tvar _data = {};\n\t\t\treturn {\n\t\t\t\tv: {\n\t\t\t\t\tget: function get(key) {\n\t\t\t\t\t\treturn key in _data ? Promise.resolve(_data[key]) : Promise.reject(new Error(key + ' not found'));\n\t\t\t\t\t},\n\t\t\t\t\tset: function set(key, val) {\n\t\t\t\t\t\t_data[key] = val;\n\t\t\t\t\t\treturn Promise.resolve();\n\t\t\t\t\t},\n\t\t\t\t\tdelete: function _delete(key) {\n\t\t\t\t\t\tdelete _data[key];\n\t\t\t\t\t\treturn Promise.resolve();\n\t\t\t\t\t},\n\t\t\t\t\tclear: function clear() {\n\t\t\t\t\t\tObject.keys(_data).forEach(function (key) {\n\t\t\t\t\t\t\treturn delete _data[key];\n\t\t\t\t\t\t});\n\t\t\t\t\t\treturn Promise.resolve();\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t};\n\t\t}();\n\n\t\tif ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === \"object\") return _ret.v;\n\t}\n\n\t// tap into/create the mup-web database, with a `cache` store\n}\n\n/**\n * Generates a function that can read queries and return hits in the supplied cache\n *\n * @param {Object} cache the persistent cache containing query-able data\n * @param {Object} query query for app data\n * @return {Promise} resolves with cache hit, otherwise rejects\n */\nvar cacheReader = exports.cacheReader = function cacheReader(cache) {\n\treturn function (query) {\n\t\treturn cache.get(JSON.stringify(query)).then(function (response) {\n\t\t\treturn [query, response];\n\t\t}).catch(function (err) {\n\t\t\treturn [query, null];\n\t\t});\n\t};\n}; // errors don't matter - just return null\n\n/**\n * Generates a function that can write query-response values into cache\n *\n * @param {Object} cache the persistent cache containing query-able data\n * @param {Object} query query for app data\n * @param {Object} response plain object API response for the query\n * @return {Promise}\n */\nvar cacheWriter = exports.cacheWriter = function cacheWriter(cache) {\n\treturn function (query, response) {\n\t\treturn cache.set(JSON.stringify(query), response);\n\t};\n};\n\nfunction checkEnable() {\n\tif (typeof window !== 'undefined' && window.location) {\n\t\tvar params = new URLSearchParams(window.location.search.slice(1));\n\t\treturn !params.has('__nocache');\n\t}\n\treturn true;\n}\n\n/**\n * The cache middleware triggers a 'set'/store action when new data is received\n * from the API (API_SUCCESS), and is queried when queries are sent to the API\n * (API_REQUEST). These events trigger cache-specific events, CACHE_SET and\n * CACHE_QUERY, which are then used to update the cache or update the\n * application state (CACHE_SUCCESS)\n *\n * @returns {Function} the curried state => action => next middleware function\n */\nvar CacheMiddleware = function CacheMiddleware(store) {\n\n\tif (!checkEnable()) {\n\t\treturn function (next) {\n\t\t\treturn function (action) {\n\t\t\t\treturn next(action);\n\t\t\t};\n\t\t};\n\t}\n\t// get a cache, any cache (that conforms to the Promise-based API)\n\tvar cache = makeCache();\n\n\t// get a function that can read from the cache for a specific query\n\tvar readCache = cacheReader(cache);\n\t// get a function that can write to the cache for a specific query-response\n\tvar writeCache = cacheWriter(cache);\n\n\treturn function (next) {\n\t\treturn function (action) {\n\t\t\t/**\n    * API_REQUEST means the application wants data described by the\n    * `queries` in the action payload - just forward those to the\n    * CACHE_REQUEST action and dispatch it\n    */\n\t\t\tif (action.type === 'API_REQUEST') {\n\t\t\t\tstore.dispatch((0, _cacheActionCreators.cacheRequest)(action.payload));\n\t\t\t}\n\t\t\tif (action.type === 'LOGOUT_REQUEST') {\n\t\t\t\tstore.dispatch((0, _cacheActionCreators.cacheClear)());\n\t\t\t}\n\n\t\t\t/**\n    * API_SUCCESS means there is fresh data ready to be stored - extract the\n    * queries and their responses, then dispatch `CACHE_SET` actions with each\n    * pair\n    */\n\t\t\tif (action.type === 'API_SUCCESS') {\n\t\t\t\t(function () {\n\t\t\t\t\tvar dispatchCacheSet = (0, _redux.bindActionCreators)(_cacheActionCreators.cacheSet, store.dispatch);\n\t\t\t\t\tvar _action$payload = action.payload;\n\t\t\t\t\tvar queries = _action$payload.queries;\n\t\t\t\t\tvar responses = _action$payload.responses;\n\n\t\t\t\t\tqueries.forEach(function (query, i) {\n\t\t\t\t\t\tvar response = responses[i];\n\t\t\t\t\t\tdispatchCacheSet(query, response);\n\t\t\t\t\t});\n\t\t\t\t})();\n\t\t\t}\n\n\t\t\t/**\n    * Observables are heavily used in CACHE_REQUEST because each query results in\n    * an async 'get' (Promise) from the Cache - all 'gets' happen in parallel and\n    * the results are collated into a single response object containing the cache\n    * hits.\n    */\n\t\t\tif (action.type === 'CACHE_REQUEST') {\n\t\t\t\tvar dispatchCacheSuccess = (0, _redux.bindActionCreators)(_cacheActionCreators.cacheSuccess, store.dispatch);\n\n\t\t\t\tvar cachedResponse$ = _rx2.default.Observable.from(action.payload) // fan-out\n\t\t\t\t.flatMap(readCache) // look for a cache hit\n\t\t\t\t.filter(function (_ref) {\n\t\t\t\t\tvar _ref2 = _slicedToArray(_ref, 2);\n\n\t\t\t\t\tvar query = _ref2[0];\n\t\t\t\t\tvar response = _ref2[1];\n\t\t\t\t\treturn response;\n\t\t\t\t}) // ignore misses\n\t\t\t\t.reduce(function (acc, _ref3) {\n\t\t\t\t\tvar _ref4 = _slicedToArray(_ref3, 2);\n\n\t\t\t\t\tvar query = _ref4[0];\n\t\t\t\t\tvar response = _ref4[1];\n\t\t\t\t\t// fan-in to create response\n\t\t\t\t\tacc.queries.push(query);\n\t\t\t\t\tacc.responses.push(response);\n\t\t\t\t\treturn acc;\n\t\t\t\t}, { queries: [], responses: [] }) // empty response structure\n\t\t\t\t.filter(function (_ref5) {\n\t\t\t\t\tvar queries = _ref5.queries;\n\t\t\t\t\tvar responses = _ref5.responses;\n\t\t\t\t\treturn queries.length;\n\t\t\t\t}); // only deliver if hits\n\n\t\t\t\tcachedResponse$.subscribe(dispatchCacheSuccess, function (err) {\n\t\t\t\t\treturn console.log('Problem reading from cache', err);\n\t\t\t\t} // cache error is no-op\n\t\t\t\t);\n\t\t\t}\n\n\t\t\t/**\n    * CACHE_SET is a specific instruction to add a single query-response pair\n    * to the cache. Do it.\n    */\n\t\t\tif (action.type === 'CACHE_SET') {\n\t\t\t\tvar _action$payload2 = action.payload;\n\t\t\t\tvar query = _action$payload2.query;\n\t\t\t\tvar response = _action$payload2.response;\n\t\t\t\t// this is async - technically values aren't immediately available\n\n\t\t\t\twriteCache(query, response);\n\t\t\t}\n\n\t\t\tif (action.type === 'CACHE_CLEAR') {\n\t\t\t\tcache.clear();\n\t\t\t}\n\n\t\t\treturn next(action);\n\t\t};\n\t};\n};\n\nexports.default = CacheMiddleware;\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/middleware/cache.js\n// module id = 14\n// module chunks = 4\n\n//# sourceURL=webpack:///./src/middleware/cache.js?");

/***/ },

/***/ 20:
/***/ function(module, exports) {

"use strict";
eval("'use strict';\n\nObject.defineProperty(exports, \"__esModule\", {\n\tvalue: true\n});\nexports.cacheSet = cacheSet;\nexports.cacheRequest = cacheRequest;\nexports.cacheSuccess = cacheSuccess;\nexports.cacheClear = cacheClear;\nfunction cacheSet(query, response) {\n\treturn {\n\t\ttype: 'CACHE_SET',\n\t\tpayload: { query: query, response: response }\n\t};\n}\n\nfunction cacheRequest(queries) {\n\treturn {\n\t\ttype: 'CACHE_REQUEST',\n\t\tpayload: queries\n\t};\n}\n\nfunction cacheSuccess(_ref) {\n\tvar queries = _ref.queries;\n\tvar responses = _ref.responses;\n\n\treturn {\n\t\ttype: 'CACHE_SUCCESS',\n\t\tpayload: { queries: queries, responses: responses }\n\t};\n}\n\nfunction cacheClear() {\n\treturn {\n\t\ttype: 'CACHE_CLEAR'\n\t};\n}\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/actions/cacheActionCreators.js\n// module id = 20\n// module chunks = 4\n\n//# sourceURL=webpack:///./src/actions/cacheActionCreators.js?");

/***/ },

/***/ 41:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(14);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi middleware/cache\n// module id = 41\n// module chunks = 4\n\n//# sourceURL=webpack:///multi_middleware/cache?");

/***/ }

/******/ });