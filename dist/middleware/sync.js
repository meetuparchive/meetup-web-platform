(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react-router-redux"), require("react-router/lib/match"), require("redux"), require("rx"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["react-router-redux", "react-router/lib/match", "redux", "rx"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("react-router-redux"), require("react-router/lib/match"), require("redux"), require("rx"));
	else
		root["meetup-web-platform"] = factory(root["react-router-redux"], root["react-router/lib/match"], root["redux"], root["rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_31__, __WEBPACK_EXTERNAL_MODULE_32__, __WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_0__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 40);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports) {

module.exports = require("rx");

/***/ },

/***/ 1:
/***/ function(module, exports) {

module.exports = require("redux");

/***/ },

/***/ 13:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_rx__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_redux__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_redux__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_redux__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_react_router_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_react_router_redux__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__util_routeUtils__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__util_fetchUtils__ = __webpack_require__(6);
/**
 * Sync middleware will hit the API when the server first renders the page and
 * when the router updates the app location.
 *
 * In order to call the correct API, it matches the current location to a route,
 * and the route specifies the function that can be called to build an API
 * request config (query)
 *
 * @module SyncMiddleware
 */








/**
 * navRenderSub lives for the entire request, but only responds to the most
 * recent routing action, so it's a module-scoped 'SerialDisposable', which
 * will take care of disposing previous subscriptions automatically
 */
var navRenderSub = new __WEBPACK_IMPORTED_MODULE_0_rx___default.a.SerialDisposable();

/**
 * The middleware is exported as a getter because it needs the application's
 * routes in order to sync correctly.
 *
 * The middleware itself - passes the queries to the application server, which
 * will make necessary calls to the API
 */
var getSyncMiddleware = function getSyncMiddleware(routes) {
	return function (store) {
		return function (next) {
			return function (action) {
				if (action.type === __WEBPACK_IMPORTED_MODULE_2_react_router_redux__["LOCATION_CHANGE"] || // client nav
				action.type === '@@server/RENDER' || action.type === 'LOCATION_SYNC') {
					var dispatchApiRequest = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_redux__["bindActionCreators"])(__WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__["a" /* apiRequest */], store.dispatch);

					var location = action.payload;
					var activeQueries$ = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__util_routeUtils__["a" /* activeRouteQueries$ */])(routes, { location: location }).delay(0) // needed in order for LOCATION_CHANGE to finish processing
					.filter(function (queries) {
						return queries;
					}); // only emit value if queries exist

					activeQueries$.subscribe(dispatchApiRequest);
				}

				if (action.type === 'CONFIGURE_AUTH' && !action.meta) {
					setTimeout(function () {
						store.dispatch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__["b" /* locationSync */])(store.getState().routing.locationBeforeTransitions));
					}, 0);
				}

				if (action.type === 'API_REQUEST') {
					var actions = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_redux__["bindActionCreators"])({ apiSuccess: __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__["c" /* apiSuccess */], apiError: __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__["d" /* apiError */], apiComplete: __WEBPACK_IMPORTED_MODULE_3__actions_syncActionCreators__["e" /* apiComplete */] }, store.dispatch);

					var _store$getState = store.getState();

					var auth = _store$getState.auth;
					var config = _store$getState.config;


					var apiFetch$ = __WEBPACK_IMPORTED_MODULE_0_rx___default.a.Observable.just(action.payload).flatMap(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__util_fetchUtils__["a" /* fetchQueries */])(auth.oauth_token, config.apiUrl, 'GET'));

					// dispatch the sync action
					navRenderSub.setDisposable(apiFetch$.subscribe(actions.apiSuccess, actions.apiError, actions.apiComplete));
				}

				return next(action);
			};
		};
	};
};

/* harmony default export */ exports["default"] = getSyncMiddleware;

/***/ },

/***/ 16:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony export */ exports["a"] = apiRequest;/* harmony export */ exports["c"] = apiSuccess;/* harmony export */ exports["d"] = apiError;/* harmony export */ exports["e"] = apiComplete;/* harmony export */ exports["b"] = locationSync;function apiRequest(queries) {
	return {
		type: 'API_REQUEST',
		payload: queries
	};
}

function apiSuccess(_ref) {
	var queries = _ref.queries;
	var responses = _ref.responses;

	return {
		type: 'API_SUCCESS',
		payload: { queries: queries, responses: responses }
	};
}

function apiError(err) {
	console.error(err.message);
	return {
		type: 'API_ERROR',
		payload: err
	};
}

function apiComplete() {
	return {
		type: 'API_COMPLETE'
	};
}

function locationSync(location) {
	return {
		type: 'LOCATION_SYNC',
		payload: location
	};
}

/***/ },

/***/ 22:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_rx__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react_router_lib_match__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_react_router_lib_match___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_react_router_lib_match__);
/* harmony export */ exports["a"] = activeRouteQueries$;var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Utilities for interacting with the Router and getting location data
 * @module routeUtils
 */



// Create observable from callback-based `match`
var match$ = __WEBPACK_IMPORTED_MODULE_0_rx___default.a.Observable.fromNodeCallback(__WEBPACK_IMPORTED_MODULE_1_react_router_lib_match___default.a);

/**
 * From the renderProps provided by React Router's `match`, collect the results
 * of the query properties associated with currently-active routes
 *
 * @param matchCallbackArgs {Array} redirectLocation(ignored) and renderProps
 * @return {Array} The return values of each active route's query function
 */
function getActiveRouteQueries(_ref) {
	var _ref2 = _slicedToArray(_ref, 2);

	var _ref2$ = _ref2[1];
	var routes = _ref2$.routes;
	var location = _ref2$.location;
	var params = _ref2$.params;

	return routes.filter(function (_ref3) {
		var query = _ref3.query;
		return query;
	}) // only get routes with queries
	.reduce(function (queries, _ref4) {
		var query = _ref4.query;
		// assemble into one array of queries
		var routeQueries = query instanceof Array ? query : [query];
		return queries.concat(routeQueries);
	}, []).map(function (query) {
		return query({ location: location, params: params });
	}); // call the query function
}

function addParamsToMatch(newParams) {
	return function (match) {
		var _match = _slicedToArray(match, 2);

		var redirectLocation = _match[0];
		var renderProps = _match[1];

		var params = renderProps.params || {};
		renderProps.params = _extends({}, params, newParams);
		return [redirectLocation, renderProps];
	};
}

function activeRouteQueries$(routes, _ref5) {
	var location = _ref5.location;
	var auth = _ref5.auth;

	return match$({ routes: routes, location: location }).map(addParamsToMatch({ auth: auth })) // queries may need to know logged-in user
	.map(getActiveRouteQueries); // collect queries from active routes
}

/***/ },

/***/ 31:
/***/ function(module, exports) {

module.exports = require("react-router-redux");

/***/ },

/***/ 32:
/***/ function(module, exports) {

module.exports = require("react-router/lib/match");

/***/ },

/***/ 40:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(13);


/***/ },

/***/ 6:
/***/ function(module, exports, __webpack_require__) {

"use strict";

/* harmony export */ __webpack_require__.d(exports, "a", function() { return fetchQueries; });/**
 * A module for middleware that would like to make external calls through `fetch`
 * @module fetchUtils
 */

/**
 * Wrapper around `fetch` to send an array of queries to the server. It ensures
 * that the request will have the required Oauth access token and constructs
 * the `fetch` call arguments based on the request method
 * @param {String} oauth_token
 * @param {String} apiUrl the general-purpose endpoint for API calls to the
 *   application server
 * @param {String} method (Optional) "get", "post", "delete", or "patch"
 * @return {Promise} resolves with a `{queries, responses}` object
 */
var fetchQueries = function fetchQueries(oauth_token, apiUrl, method) {
	return function (queries) {
		if (!oauth_token) {
			return Promise.reject(new Error('No access token provided - cannot ' + method + ' request to API'));
		}
		method = method || 'GET';
		var isPost = method.toLowerCase() === 'post';

		var params = new URLSearchParams();
		params.append('queries', JSON.stringify(queries));
		var fetchUrl = apiUrl + '?' + (isPost ? '' : params);
		var fetchConfig = {
			method: method,
			headers: {
				Authorization: 'Bearer ' + oauth_token,
				'content-type': isPost ? 'application/x-www-form-urlencoded' : 'text/plain'
			}
		};
		if (isPost) {
			fetchConfig.body = params;
		}
		return fetch(fetchUrl, fetchConfig).then(function (queryResponse) {
			return queryResponse.json();
		}).then(function (responses) {
			return { queries: queries, responses: responses };
		});
	};
};

/***/ }

/******/ })
});
;