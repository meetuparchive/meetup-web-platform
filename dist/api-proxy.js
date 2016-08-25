(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("crypto"), require("request"), require("rx"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["crypto", "request", "rx"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("crypto"), require("request"), require("rx"));
	else
		root["meetup-web-platform"] = factory(root["crypto"], root["request"], root["rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_0__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 36);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports) {

module.exports = require("rx");

/***/ },

/***/ 2:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_rx__);

/* harmony export */ __webpack_require__.d(exports, "catchAndReturn$", function() { return catchAndReturn$; });
/**
 * Utilities to help with Observable sequences
 *
 * @module rxUtils
 */

/**
 * utility to log errors and return a curried fallback value
 *
 * @param {Object} errorResponse anything to return in an observable
 * @param {Object} log (optional) A logging function
 * @param {Error} error (in curried return function) The error to handle
 * @returns {Observable} single-element observable
 */
var catchAndReturn$ = function catchAndReturn$(errorResponse, log) {
  return function (error) {
    log = log || console.log;
    console.warn('Error: ' + error.message);
    log(['error'], error.stack);

    return __WEBPACK_IMPORTED_MODULE_0_rx___default.a.Observable.just(errorResponse || { error: error });
  };
};

/***/ },

/***/ 3:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_crypto__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_crypto___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_crypto__);
/* harmony export */ exports["a"] = duotoneRef;
/* harmony export */ __webpack_require__.d(exports, "c", function() { return duotones; });/* unused harmony export generateSignedDuotoneUrl */
/* harmony export */ __webpack_require__.d(exports, "b", function() { return getDuotoneUrls; });var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



/**
 * Utility methods for working with duotone URLs
 *
 * @module duotone
 */

/**
 * The canonical string reference to a duotone is the 'spec'
 * defined by the photo scaler routing rules.
 *
 * @link www.meetup.com/meetup_api/docs/sign/photo_transform/
 * @param {String} light the hex value for the 'light' color of the duotone
 * @param {String} dark the hex value for the 'dark' color of the duotone
 */
function duotoneRef(light, dark) {
  return 'dt' + dark + 'x' + light;
}

// duotone pairs in the format [multiply, screen] (or [light, dark])
var HYPERCOLOR = ['ff7900', '7700c8'];
var SIZZURP = ['48ffcb', '8a00eb'];
var JUNIOR_VARSITY = ['ffc600', '2737ff'];
var MIGHTY_DUCKS = ['00d8ff', 'fa002f'];
var MERMAID = ['36c200', '002fff'];
var GINGER_BEER = ['ffde00', '55005a'];
var BUBBLICIOUS = ['ff646a', '000ddf'];
var LEMON_LIME = ['fed239', '36c200'];

/**
 * Supported duotone color pairs (hex)
 *
 * @link {https://meetup.atlassian.net/wiki/pages/viewpage.action?pageId=19234854}
 * @const
 */
var duotones = [HYPERCOLOR, SIZZURP, JUNIOR_VARSITY, MIGHTY_DUCKS, MERMAID, GINGER_BEER, BUBBLICIOUS, LEMON_LIME];

/**
 * Server-side utilities for managing signed duotone photo scaler URLs
 *
 * **Important** Do not import this module in client-side code
 *
* - All duo-toning is done in the photo scaler (http://photos1.meetupstatic.com/photo_api/...)
 *   the duotoned images aren't saved anywhere
 * - The photo scaler requires signed URLs in order to ensure that requests are
 *   coming from "authorized" clients that aren't going to DDoS it.
 * - The URL signature corresponds to a particular photo scaler transform 'spec',
 *   including dimensions, which can then be applied to any photo. The REST API
 *   does not provide the duotoned URLs because they tend to be application-
 *   specific - it just returns a pair of hex values corresponding to the
 *   duotone 'light_color' and 'dark_color'.
 * - In order to sign the URL, the application needs a secret salt for the hash,
 *   which means the signing needs to happen on the server for a fixed set of
 *   transformations (one for each duotone color pair).
 * - Once the server has the signed URLs (which never change - they can be
 *   applied to any photo ID), it needs to send them to the client through
 *   application state, which is the only data link that currently exists
 *   between the server and the application.
 *
 * @module duotoneServer
 */

/**
 * Using a passed in *SECRET* salt, generate the photo scaler URL templates
 * in the format described by the sign/photo_transform API. Return the values
 * in an object keyed by the duotone 'spec'
 *
 * @link {https://www.meetup.com/meetup_api/docs/sign/photo_transform/}
 * @param {String} salt The salt used by all platforms generating signed URLs
 * for the photo scaler - this is a shared secret that should *never* be
 * managed on the client
 * @param {Array} duotone [light, dark] hex codes for a duotone pair
 * @return {Object} a [duotoneRef]: URLroot key-value pair
 */
function generateSignedDuotoneUrl(salt, _ref) {
  var _ref2 = _slicedToArray(_ref, 2);

  var light = _ref2[0];
  var dark = _ref2[1];

  var ref = duotoneRef(light, dark);
  var spec = 'event/rx300x400/' + ref;
  var signature = __WEBPACK_IMPORTED_MODULE_0_crypto___default.a.createHash('sha1').update('' + spec + salt).digest('hex').substring(0, 10);
  return _defineProperty({}, ref, 'http://photos1.meetupstatic.com/photo_api/' + spec + '/sg' + signature);
}

/**
 * Build the complete "[ref]: urlroot" object containing signed url roots for
 * all the supported duotone pairs
 *
 * @param {String} PHOTO_SCALER_SALT **Secret** salt for generating signed urls
 */
var getDuotoneUrls = function getDuotoneUrls(duotones, PHOTO_SCALER_SALT) {
  return duotones.reduce(function (duotoneMap, _ref4) {
    var _ref5 = _slicedToArray(_ref4, 2);

    var light = _ref5[0];
    var dark = _ref5[1];
    return _extends({}, duotoneMap, generateSignedDuotoneUrl(PHOTO_SCALER_SALT, [light, dark]));
  }, {});
};

/***/ },

/***/ 36:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(5);


/***/ },

/***/ 5:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_request__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_request___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_request__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rx__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rx__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__util_rxUtils__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util_duotone__ = __webpack_require__(3);

/* harmony export */ __webpack_require__.d(exports, "parseApiResponse", function() { return parseApiResponse; });/* harmony export */ exports["queryToApiConfig"] = queryToApiConfig;
/* harmony export */ __webpack_require__.d(exports, "buildRequestArgs", function() { return buildRequestArgs; });
/* harmony export */ __webpack_require__.d(exports, "apiResponseToQueryResponse", function() { return apiResponseToQueryResponse; });/* harmony export */ exports["parseRequest"] = parseRequest;
/* harmony export */ __webpack_require__.d(exports, "groupDuotoneSetter", function() { return groupDuotoneSetter; });
/* harmony export */ __webpack_require__.d(exports, "apiResponseDuotoneSetter", function() { return apiResponseDuotoneSetter; });var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



var externalRequest$ = __WEBPACK_IMPORTED_MODULE_1_rx___default.a.Observable.fromNodeCallback(__WEBPACK_IMPORTED_MODULE_0_request___default.a);




/**
 * Given the current request and API server host, proxy the request to the API
 * and return the responses corresponding to the provided queries.
 *
 * This module plugs in to any system that provides a `request` object with:
 * - headers
 * - method ('get'/'post')
 * - query string parameters parsed as a plain object (for GET requests)
 * - payload/body (for POST requests)
 *
 * @module ApiProxy
 */

/**
 * mostly error handling - any case where the API does not satisfy the
 * "api response" formatting requirement: plain object containing the requested
 * values
 *
 * This utility is specific to the response format of the API being consumed
 * @param response {String} the raw response body text from an API call
 * @return responseObj the JSON-parsed text, possibly with error info
 */
var parseApiResponse = function parseApiResponse(response) {
	var responseObj = void 0;
	try {
		responseObj = JSON.parse(response);
	} catch (e) {
		throw new TypeError('API response was not JSON: "' + response + '"');
	}
	if (responseObj && responseObj.problem) {
		throw new Error('API problem: ' + responseObj.problem + ': ' + responseObj.details);
	}

	return responseObj;
};

/**
 * Translate a query into an API `endpoint` + `params`. The translation is based
 * on the Meetup REST API.
 *
 * This function serves as an adapter between the structure of a query and the
 * API-specific config needed to get that data. Note that *each* required
 * endpoint needs to be manually configured
 *
 * {@link http://www.meetup.com/meetup_api/docs/batch/}
 *
 * @param {Object} query a query object from the application
 * @return {Object} the arguments for api request, including endpoint
 */
function queryToApiConfig(_ref) {
	var type = _ref.type;
	var params = _ref.params;
	var ref = _ref.ref;
	var single = _ref.single;

	var pathExtension = void 0;
	switch (type) {
		case 'home':
			{
				params.fields = params.fields ? params.fields + ',photo_gradient' : 'photo_gradient';
				return {
					endpoint: 'self/home',
					params: params
				};
			}
		case 'group':
			params.fields = params.fields ? params.fields + ',photo_gradient' : 'photo_gradient';
			if (params.self) {
				return {
					endpoint: 'self/groups',
					params: params
				};
			}
			return {
				endpoint: params.urlname,
				params: params
			};
		case 'event':
			pathExtension = params.id ? '/' + params.id : '';
			params.fields = ['rsvp_sample'];
			return {
				endpoint: params.urlname + '/events' + pathExtension,
				params: params
			};
		case 'member':
			return {
				endpoint: '2/member/' + params.id,
				params: params
			};
		case 'login':
			return {
				endpoint: 'sessions',
				params: params
			};
		default:
			throw new ReferenceError('No API specified for query type ' + type);
	}
}

/**
 * Join the key-value params object into a querystring-like
 * string. use `encodeURIComponent` _only_ if `doEncode` is provided,
 * otherwise the caller is responsible for encoding
 *
 * @param {Object} params plain object of keys and values to format
 * @return {String}
 */
function urlFormatParams(params, doEncode) {
	return Object.keys(params || {}).reduce(function (dataParams, paramKey) {
		var paramValue = doEncode ? encodeURIComponent(params[paramKey]) : params[paramKey];
		dataParams.push(paramKey + '=' + paramValue);
		return dataParams;
	}, []).join('&');
}

/**
 * Transform each query into the arguments needed for a `request` call.
 *
 * Some request options are constant for all queries, and these are curried into
 * a function that can be called with a single query as part of the request
 * stream
 *
 * @see {@link https://www.npmjs.com/package/request}
 *
 * @param {Object} externalRequestOpts request options that will be applied to
 *   every query request
 * @param {Object} apiConfig { endpoint, params }
 *   call)
 * @return {Object} externalRequestOptsQuery argument for the call to
 *   `externalRequest` for the query
 */
var buildRequestArgs = function buildRequestArgs(externalRequestOpts) {
	return function (_ref2) {
		var endpoint = _ref2.endpoint;
		var params = _ref2.params;

		var externalRequestOptsQuery = _extends({}, externalRequestOpts);
		externalRequestOptsQuery.url = '/' + endpoint;

		var dataParams = urlFormatParams(params, externalRequestOptsQuery.method === 'get');

		switch (externalRequestOptsQuery.method) {
			case 'get':
				externalRequestOptsQuery.url += '?' + dataParams;
				externalRequestOptsQuery.headers['X-Meta-Photo-Host'] = 'secure';
				break;
			case 'post':
				externalRequestOptsQuery.body = dataParams;
				externalRequestOptsQuery.headers['content-type'] = 'application/x-www-form-urlencoded';
				break;
		}

		return externalRequestOptsQuery;
	};
};

/**
 * Format apiResponse to match expected state structure
 *
 * @param {Object} apiResponse JSON-parsed api response data
 */
var apiResponseToQueryResponse = function apiResponseToQueryResponse(_ref3) {
	var _ref4 = _slicedToArray(_ref3, 2);

	var response = _ref4[0];
	var query = _ref4[1];
	return _defineProperty({}, query.ref, {
		type: query.type,
		value: response
	});
};

/**
 * Parse request for queries and request options
 * @return {Object} { queries, externalRequestOpts }
 */
function parseRequest(request, baseUrl) {
	var headers = request.headers;
	var method = request.method;
	var query = request.query;
	var payload = request.payload;


	var externalRequestOpts = {
		baseUrl: baseUrl,
		method: method,
		headers: _extends({}, headers), // make a copy to be immutable
		mode: 'no-cors',
		agentOptions: {
			rejectUnauthorized: baseUrl.indexOf('.dev') === -1
		}
	};

	// Forward the Hapi request headers from the client query
	// except for `host` and `accept-encoding`
	// which should be provided by the external api request
	delete externalRequestOpts.headers['host'];
	delete externalRequestOpts.headers['accept-encoding'];
	delete externalRequestOpts.headers['content-length']; // original request content-length is irrelevant

	var queriesJSON = request.method === 'get' ? query.queries : payload.queries;
	var queries = JSON.parse(queriesJSON);
	return { queries: queries, externalRequestOpts: externalRequestOpts };
}

/**
 * From a provided set of signed duotone URLs, create a function that injects
 * the full duotone URL into a group object with the key `duotoneUrl`.
 *
 * @param {Object} duotoneUrls map of `[duotoneRef]: url template root`
 * @param {Object} group group object from API
 * @return {Object} the mutated group object
 */
var groupDuotoneSetter = function groupDuotoneSetter(duotoneUrls) {
	return function (group) {
		var photo = group.key_photo || group.group_photo || {};
		var duotoneKey = group.photo_gradient && __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util_duotone__["a" /* duotoneRef */])(group.photo_gradient.light_color, group.photo_gradient.dark_color);
		var duotoneUrlRoot = duotoneKey && duotoneUrls[duotoneKey];
		if (duotoneUrlRoot && photo.id) {
			group.duotoneUrl = duotoneUrlRoot + '/' + photo.id + '.jpeg';
		}
		return group;
	};
};

/**
 * From a provided set of signed duotoneUrls, create a function that injects
 * the full duotone URL into an query response containing objects that support
 * duotoned images (anything containing group or event objects
 *
 * @param {Object} duotoneUrls map of `[duotoneRef]: url template root`
 * @param {Object} queryResponse { type: <type>, value: <API object> }
 * @return {Object} the modified queryResponse
 */
var apiResponseDuotoneSetter = function apiResponseDuotoneSetter(duotoneUrls) {
	var setGroupDuotone = groupDuotoneSetter(duotoneUrls);
	return function (queryResponse) {
		// inject duotone URLs into any group query response
		Object.keys(queryResponse).forEach(function (key) {
			var _queryResponse$key = queryResponse[key];
			var type = _queryResponse$key.type;
			var value = _queryResponse$key.value;

			var groups = void 0;
			switch (type) {
				case 'group':
					groups = value instanceof Array ? value : [value];
					groups.forEach(setGroupDuotone);
					break;
				case 'home':
					value.rows.map(function (_ref6) {
						var items = _ref6.items;
						return items;
					}).forEach(function (items) {
						return items.filter(function (_ref7) {
							var type = _ref7.type;
							return type === 'group';
						}).forEach(function (_ref8) {
							var group = _ref8.group;
							return setGroupDuotone(group);
						});
					});
					break;
			}
		});
		return queryResponse;
	};
};

/**
 * This function transforms a single request to the application server into a
 * parallel array of requests to the API server, and then re-assembles the
 * API responses into an array of 'query responses' - i.e. API responses that
 * are formatted with properties from their corresponding query (ref, type).
 *
 * Most of the `options` for the `externalRequest` are shared for all the API
 * requests, so these are initialized in `parseRequest`. `buildRequestArgs`
 * then curries those into a function that can accept a `query` to write the
 * query-specific options.
 *
 * @param {Request} request Hapi request object
 * @param {Object} baseUrl API server base URL for all API requests
 * @return Array$ contains all API responses corresponding to the provided queries
 */
var apiProxy$ = function apiProxy$(_ref9) {
	var baseUrl = _ref9.baseUrl;
	var duotoneUrls = _ref9.duotoneUrls;

	var setApiResponseDuotones = apiResponseDuotoneSetter(duotoneUrls);

	return function (request) {

		// 1. get the queries and the 'universal' `externalRequestOpts` from the request
		var _parseRequest = parseRequest(request, baseUrl);

		var queries = _parseRequest.queries;
		var externalRequestOpts = _parseRequest.externalRequestOpts;

		// 2. curry a function that uses `externalRequestOpts` as a base from which
		// to build the query-specific API request options object

		var apiConfigToRequestOptions = buildRequestArgs(externalRequestOpts);

		return __WEBPACK_IMPORTED_MODULE_1_rx___default.a.Observable.from(queries) // create stream of query objects - fan-out
		.map(queryToApiConfig) // convert query to API-specific config
		.map(apiConfigToRequestOptions) // API-specific args for api request
		.do(function (externalRequestOpts) {
			return request.log(['api'], JSON.stringify(externalRequestOpts.url));
		}) // logging
		.concatMap(function (externalRequestOpts) {
			return externalRequest$(externalRequestOpts);
		}) // make the API calls - keep order
		.map(function (_ref10) {
			var _ref11 = _slicedToArray(_ref10, 2);

			var response = _ref11[0];
			var body = _ref11[1];
			return body;
		}) // ignore Response object, just process body string
		.map(parseApiResponse) // parse into plain object
		.catch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__util_rxUtils__["catchAndReturn$"])()) // return error object instead of response
		.zipIterable(queries) // zip the apiResponse with corresponding query
		.map(apiResponseToQueryResponse) // convert apiResponse to app-ready queryResponse
		.map(setApiResponseDuotones) // special duotone prop
		.toArray(); // group all responses into a single array - fan-in
	};
};

/* harmony default export */ exports["default"] = apiProxy$;

/***/ },

/***/ 7:
/***/ function(module, exports) {

module.exports = require("crypto");

/***/ },

/***/ 8:
/***/ function(module, exports) {

module.exports = require("request");

/***/ }

/******/ })
});
;