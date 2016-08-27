(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("redux"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["redux"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("redux"));
	else
		root["meetup-web-platform"] = factory(root["redux"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 42);
/******/ })
/************************************************************************/
/******/ ({

/***/ 1:
/***/ function(module, exports) {

module.exports = require("redux");

/***/ },

/***/ 13:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_redux__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_redux__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__util_fetchUtils__ = __webpack_require__(7);



/**
 * PostMiddleware provides a generic interface for triggering POST requests and
 * dispatching particular actions with the API response. The POST action must
 * follow this structure:
 *
 * ```
 * {
 *   type: 'POST',
 *   onSuccess: a callback that takes the API response as an argument, and
 *     returns an action object. The middleware takes care of dispatch
 *   onError: a callback that takes an Error argument and returns an action
 *     object
 * }
 * ```
 *
 * This structure usually allows the success/error handling code to be bundled
 * alongside the POST action creator, with the expectation that all response
 * processing can be done there
 *
 * @module PostMiddleware
 */
var PostMiddleware = function PostMiddleware(store) {
  return function (next) {
    return function (action) {
      var type = action.type;
      var payload = action.payload;

      if (type.endsWith('_POST') || type.startsWith('POST_')) {
        var query = payload.query;
        var onSuccess = payload.onSuccess;
        var onError = payload.onError;

        var actions = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_redux__["bindActionCreators"])({
          onSuccess: onSuccess,
          onError: onError
        }, store.dispatch);

        var _store$getState = store.getState();

        var config = _store$getState.config;
        var auth = _store$getState.auth;


        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__util_fetchUtils__["a" /* fetchQueries */])(auth.oauth_token, config.apiUrl, 'POST')([query]).then(actions.onSuccess).catch(actions.onError);
      }
      return next(action);
    };
  };
};

/* harmony default export */ exports["default"] = PostMiddleware;

/***/ },

/***/ 42:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(13);


/***/ },

/***/ 7:
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