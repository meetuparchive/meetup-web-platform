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

	module.exports = __webpack_require__(4);


/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */
/***/ function(module, exports) {

	import { bindActionCreators } from 'redux';
	import { fetchQueries } from '../util/fetchUtils';

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

	        var actions = bindActionCreators({
	          onSuccess: onSuccess,
	          onError: onError
	        }, store.dispatch);

	        var _store$getState = store.getState();

	        var config = _store$getState.config;
	        var auth = _store$getState.auth;


	        fetchQueries(auth.oauth_token, config.apiUrl, 'POST')([query]).then(actions.onSuccess).catch(actions.onError);
	      }
	      return next(action);
	    };
	  };
	};

	export default PostMiddleware;

/***/ }
/******/ ]);