(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react-router-redux"), require("react-router/lib/match"), require("redux"), require("rx"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["react-router-redux", "react-router/lib/match", "redux", "rx"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("react-router-redux"), require("react-router/lib/match"), require("redux"), require("rx"));
	else
		root["meetup-web-platform"] = factory(root["react-router-redux"], root["react-router/lib/match"], root["redux"], root["rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_34__, __WEBPACK_EXTERNAL_MODULE_35__, __WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_0__) {
return /******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = 43);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports) {

eval("module.exports = require(\"rx\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"rx\"\n// module id = 0\n// module chunks = 0 1 2 3 4 7\n\n//# sourceURL=webpack:///external_%22rx%22?");

/***/ },

/***/ 1:
/***/ function(module, exports) {

eval("module.exports = require(\"redux\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"redux\"\n// module id = 1\n// module chunks = 1 3 4 5\n\n//# sourceURL=webpack:///external_%22redux%22?");

/***/ },

/***/ 14:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx__ = __webpack_require__(0);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_rx__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_redux__ = __webpack_require__(1);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_redux__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_redux__ = __webpack_require__(34);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_react_router_redux__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__ = __webpack_require__(19);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__util_routeUtils__ = __webpack_require__(25);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__util_fetchUtils__ = __webpack_require__(7);\n/**\n * Sync middleware will hit the API when the server first renders the page and\n * when the router updates the app location.\n *\n * In order to call the correct API, it matches the current location to a route,\n * and the route specifies the function that can be called to build an API\n * request config (query)\n *\n * @module SyncMiddleware\n */\n\n\n\n\n\n\n\n\n/**\n * navRenderSub lives for the entire request, but only responds to the most\n * recent routing action, so it's a module-scoped 'SerialDisposable', which\n * will take care of disposing previous subscriptions automatically\n */\nvar navRenderSub = new __WEBPACK_IMPORTED_MODULE_0_rx___default.a.SerialDisposable();\n\n/**\n * The middleware is exported as a getter because it needs the application's\n * routes in order to sync correctly.\n *\n * The middleware itself - passes the queries to the application server, which\n * will make necessary calls to the API\n */\nvar getSyncMiddleware = function getSyncMiddleware(routes) {\n\treturn function (store) {\n\t\treturn function (next) {\n\t\t\treturn function (action) {\n\t\t\t\tif (action.type === __WEBPACK_IMPORTED_MODULE_2_react_router_redux__[\"LOCATION_CHANGE\"] || // client nav\n\t\t\t\taction.type === '@@server/RENDER' || action.type === 'LOCATION_SYNC') {\n\t\t\t\t\tvar dispatchApiRequest = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_redux__[\"bindActionCreators\"])(__WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__[\"a\" /* apiRequest */], store.dispatch);\n\n\t\t\t\t\tvar location = action.payload;\n\t\t\t\t\tvar activeQueries$ = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_routeUtils__[\"a\" /* activeRouteQueries$ */])(routes, { location: location }).delay(0) // needed in order for LOCATION_CHANGE to finish processing\n\t\t\t\t\t.filter(function (queries) {\n\t\t\t\t\t\treturn queries;\n\t\t\t\t\t}); // only emit value if queries exist\n\n\t\t\t\t\tactiveQueries$.subscribe(dispatchApiRequest);\n\t\t\t\t}\n\n\t\t\t\tif (action.type === 'CONFIGURE_AUTH' && !action.meta) {\n\t\t\t\t\tsetTimeout(function () {\n\t\t\t\t\t\tstore.dispatch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__[\"b\" /* locationSync */])(store.getState().routing.locationBeforeTransitions));\n\t\t\t\t\t}, 0);\n\t\t\t\t}\n\n\t\t\t\tif (action.type === 'API_REQUEST') {\n\t\t\t\t\tvar actions = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_redux__[\"bindActionCreators\"])({ apiSuccess: __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__[\"c\" /* apiSuccess */], apiError: __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__[\"d\" /* apiError */], apiComplete: __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__[\"e\" /* apiComplete */] }, store.dispatch);\n\n\t\t\t\t\tvar _store$getState = store.getState();\n\n\t\t\t\t\tvar auth = _store$getState.auth;\n\t\t\t\t\tvar config = _store$getState.config;\n\n\n\t\t\t\t\tvar apiFetch$ = __WEBPACK_IMPORTED_MODULE_0_rx___default.a.Observable.just(action.payload).flatMap(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__util_fetchUtils__[\"a\" /* fetchQueries */])(auth.oauth_token, config.apiUrl, 'GET'));\n\n\t\t\t\t\t// dispatch the sync action\n\t\t\t\t\tnavRenderSub.setDisposable(apiFetch$.subscribe(actions.apiSuccess, actions.apiError, actions.apiComplete));\n\t\t\t\t}\n\n\t\t\t\treturn next(action);\n\t\t\t};\n\t\t};\n\t};\n};\n\n/* harmony default export */ exports[\"default\"] = getSyncMiddleware;\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/middleware/sync.js\n// module id = 14\n// module chunks = 1\n\n//# sourceURL=webpack:///./src/middleware/sync.js?");

/***/ },

/***/ 19:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony export */ exports[\"a\"] = apiRequest;/* harmony export */ exports[\"c\"] = apiSuccess;/* harmony export */ exports[\"d\"] = apiError;/* harmony export */ exports[\"e\"] = apiComplete;/* harmony export */ exports[\"b\"] = locationSync;function apiRequest(queries) {\n\treturn {\n\t\ttype: 'API_REQUEST',\n\t\tpayload: queries\n\t};\n}\n\nfunction apiSuccess(_ref) {\n\tvar queries = _ref.queries;\n\tvar responses = _ref.responses;\n\n\treturn {\n\t\ttype: 'API_SUCCESS',\n\t\tpayload: { queries: queries, responses: responses }\n\t};\n}\n\nfunction apiError(err) {\n\tconsole.error(err.message);\n\treturn {\n\t\ttype: 'API_ERROR',\n\t\tpayload: err\n\t};\n}\n\nfunction apiComplete() {\n\treturn {\n\t\ttype: 'API_COMPLETE'\n\t};\n}\n\nfunction locationSync(location) {\n\treturn {\n\t\ttype: 'LOCATION_SYNC',\n\t\tpayload: location\n\t};\n}\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/actions/syncActionCreators.js\n// module id = 19\n// module chunks = 1\n\n//# sourceURL=webpack:///./src/actions/syncActionCreators.js?");

/***/ },

/***/ 25:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx__ = __webpack_require__(0);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_rx__);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react_router_lib_match__ = __webpack_require__(35);\n/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react_router_lib_match___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_react_router_lib_match__);\n/* harmony export */ exports[\"a\"] = activeRouteQueries$;var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };\n\nvar _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i[\"return\"]) _i[\"return\"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError(\"Invalid attempt to destructure non-iterable instance\"); } }; }();\n\n/**\n * Utilities for interacting with the Router and getting location data\n * @module routeUtils\n */\n\n\n\n// Create observable from callback-based `match`\nvar match$ = __WEBPACK_IMPORTED_MODULE_0_rx___default.a.Observable.fromNodeCallback(__WEBPACK_IMPORTED_MODULE_1_react_router_lib_match___default.a);\n\n/**\n * From the renderProps provided by React Router's `match`, collect the results\n * of the query properties associated with currently-active routes\n *\n * @param matchCallbackArgs {Array} redirectLocation(ignored) and renderProps\n * @return {Array} The return values of each active route's query function\n */\nfunction getActiveRouteQueries(_ref) {\n\tvar _ref2 = _slicedToArray(_ref, 2);\n\n\tvar _ref2$ = _ref2[1];\n\tvar routes = _ref2$.routes;\n\tvar location = _ref2$.location;\n\tvar params = _ref2$.params;\n\n\treturn routes.filter(function (_ref3) {\n\t\tvar query = _ref3.query;\n\t\treturn query;\n\t}) // only get routes with queries\n\t.reduce(function (queries, _ref4) {\n\t\tvar query = _ref4.query;\n\t\t// assemble into one array of queries\n\t\tvar routeQueries = query instanceof Array ? query : [query];\n\t\treturn queries.concat(routeQueries);\n\t}, []).map(function (query) {\n\t\treturn query({ location: location, params: params });\n\t}); // call the query function\n}\n\nfunction addParamsToMatch(newParams) {\n\treturn function (match) {\n\t\tvar _match = _slicedToArray(match, 2);\n\n\t\tvar redirectLocation = _match[0];\n\t\tvar renderProps = _match[1];\n\n\t\tvar params = renderProps.params || {};\n\t\trenderProps.params = _extends({}, params, newParams);\n\t\treturn [redirectLocation, renderProps];\n\t};\n}\n\nfunction activeRouteQueries$(routes, _ref5) {\n\tvar location = _ref5.location;\n\tvar auth = _ref5.auth;\n\n\treturn match$({ routes: routes, location: location }).map(addParamsToMatch({ auth: auth })) // queries may need to know logged-in user\n\t.map(getActiveRouteQueries); // collect queries from active routes\n}\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/util/routeUtils.js\n// module id = 25\n// module chunks = 1\n\n//# sourceURL=webpack:///./src/util/routeUtils.js?");

/***/ },

/***/ 34:
/***/ function(module, exports) {

eval("module.exports = require(\"react-router-redux\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"react-router-redux\"\n// module id = 34\n// module chunks = 1\n\n//# sourceURL=webpack:///external_%22react-router-redux%22?");

/***/ },

/***/ 35:
/***/ function(module, exports) {

eval("module.exports = require(\"react-router/lib/match\");\n\n//////////////////\n// WEBPACK FOOTER\n// external \"react-router/lib/match\"\n// module id = 35\n// module chunks = 1\n\n//# sourceURL=webpack:///external_%22react-router/lib/match%22?");

/***/ },

/***/ 43:
/***/ function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(14);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi middleware/sync\n// module id = 43\n// module chunks = 1\n\n//# sourceURL=webpack:///multi_middleware/sync?");

/***/ },

/***/ 7:
/***/ function(module, exports, __webpack_require__) {

"use strict";
eval("\n/* harmony export */ __webpack_require__.d(exports, \"a\", function() { return fetchQueries; });/**\n * A module for middleware that would like to make external calls through `fetch`\n * @module fetchUtils\n */\n\n/**\n * Wrapper around `fetch` to send an array of queries to the server. It ensures\n * that the request will have the required Oauth access token and constructs\n * the `fetch` call arguments based on the request method\n * @param {String} oauth_token\n * @param {String} apiUrl the general-purpose endpoint for API calls to the\n *   application server\n * @param {String} method (Optional) \"get\", \"post\", \"delete\", or \"patch\"\n * @return {Promise} resolves with a `{queries, responses}` object\n */\nvar fetchQueries = function fetchQueries(oauth_token, apiUrl, method) {\n\treturn function (queries) {\n\t\tif (!oauth_token) {\n\t\t\treturn Promise.reject(new Error('No access token provided - cannot ' + method + ' request to API'));\n\t\t}\n\t\tmethod = method || 'GET';\n\t\tvar isPost = method.toLowerCase() === 'post';\n\n\t\tvar params = new URLSearchParams();\n\t\tparams.append('queries', JSON.stringify(queries));\n\t\tvar fetchUrl = apiUrl + '?' + (isPost ? '' : params);\n\t\tvar fetchConfig = {\n\t\t\tmethod: method,\n\t\t\theaders: {\n\t\t\t\tAuthorization: 'Bearer ' + oauth_token,\n\t\t\t\t'content-type': isPost ? 'application/x-www-form-urlencoded' : 'text/plain'\n\t\t\t}\n\t\t};\n\t\tif (isPost) {\n\t\t\tfetchConfig.body = params;\n\t\t}\n\t\treturn fetch(fetchUrl, fetchConfig).then(function (queryResponse) {\n\t\t\treturn queryResponse.json();\n\t\t}).then(function (responses) {\n\t\t\treturn { queries: queries, responses: responses };\n\t\t});\n\t};\n};\n\n//////////////////\n// WEBPACK FOOTER\n// ./src/util/fetchUtils.js\n// module id = 7\n// module chunks = 1 5\n\n//# sourceURL=webpack:///./src/util/fetchUtils.js?");

/***/ }

/******/ })
});
;