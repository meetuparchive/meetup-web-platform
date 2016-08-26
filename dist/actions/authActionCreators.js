(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", [], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory();
	else
		root["meetup-web-platform"] = factory();
})(this, function() {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 39);
/******/ })
/************************************************************************/
/******/ ({

/***/ 39:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(4);


/***/ },

/***/ 4:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony export */ exports["loginPost"] = loginPost;/* harmony export */ exports["configureAuth"] = configureAuth;/* harmony export */ exports["loginSuccess"] = loginSuccess;/* harmony export */ exports["loginError"] = loginError;/* harmony export */ exports["logoutRequest"] = logoutRequest;/* harmony export */ exports["logoutSuccess"] = logoutSuccess;/* harmony export */ exports["logoutError"] = logoutError;/**
 * @module authActionCreators
 */

/**
 * Create a 'POST' action with onSuccess that parses the API response and
 * returns either a loginError action (API successfully returned, but the
 * response indicates login failure) or a loginSuccess action. onError always
 * returns a loginError action
 * @param {Object} params object with 'email' and 'password' props
 */
function loginPost(params) {
	var LOGIN_REF = 'login';
	return {
		type: 'LOGIN_POST',
		payload: {
			query: {
				type: 'login',
				params: params,
				ref: LOGIN_REF
			},
			onSuccess: function onSuccess(_ref) {
				var queries = _ref.queries;
				var responses = _ref.responses;

				// get the response `value`
				var response = responses.slice()[0][LOGIN_REF];
				// check for errors reported by API (will be handled by loginError)

				if (response.value.errors) {
					return loginError(response.value.errors);
				}
				// otherwise return the action
				return loginSuccess(response);
			},
			onError: loginError
		}
	};
}

function configureAuth(auth, isServer) {
	return {
		type: 'CONFIGURE_AUTH',
		payload: auth,
		meta: isServer
	};
}

function loginSuccess(response) {
	return {
		type: 'LOGIN_SUCCESS',
		payload: response
	};
}

function loginError(response) {
	return {
		type: 'LOGIN_ERROR',
		payload: response
	};
}

function logoutRequest() {
	return {
		type: 'LOGOUT_REQUEST'
	};
}

function logoutSuccess(auth) {
	return {
		type: 'LOGOUT_SUCCESS',
		payload: auth
	};
}

function logoutError() {
	return {
		type: 'LOGOUT_ERROR'
	};
}

/***/ }

/******/ })
});
;