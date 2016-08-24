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

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports) {

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	import externalRequest from 'request';
	import Rx from 'rx';
	var externalRequest$ = Rx.Observable.fromNodeCallback(externalRequest);

	import { catchAndReturn$ } from '../src/util/rxUtils';
	import { duotoneRef } from './util/duotone';

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
	export var parseApiResponse = function parseApiResponse(response) {
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
	export function queryToApiConfig(_ref) {
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
	export var buildRequestArgs = function buildRequestArgs(externalRequestOpts) {
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
	export var apiResponseToQueryResponse = function apiResponseToQueryResponse(_ref3) {
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
	export function parseRequest(request, baseUrl) {
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
	export var groupDuotoneSetter = function groupDuotoneSetter(duotoneUrls) {
		return function (group) {
			var photo = group.key_photo || group.group_photo || {};
			var duotoneKey = group.photo_gradient && duotoneRef(group.photo_gradient.light_color, group.photo_gradient.dark_color);
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
	export var apiResponseDuotoneSetter = function apiResponseDuotoneSetter(duotoneUrls) {
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

			return Rx.Observable.from(queries) // create stream of query objects - fan-out
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
			.catch(catchAndReturn$()) // return error object instead of response
			.zipIterable(queries) // zip the apiResponse with corresponding query
			.map(apiResponseToQueryResponse) // convert apiResponse to app-ready queryResponse
			.map(setApiResponseDuotones) // special duotone prop
			.toArray(); // group all responses into a single array - fan-in
		};
	};

	export default apiProxy$;

/***/ }
/******/ ]);