(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("js-cookie"), require("redux"), require("rx"));
	else if(typeof define === 'function' && define.amd)
		define("meetup-web-platform", ["js-cookie", "redux", "rx"], factory);
	else if(typeof exports === 'object')
		exports["meetup-web-platform"] = factory(require("js-cookie"), require("redux"), require("rx"));
	else
		root["meetup-web-platform"] = factory(root["js-cookie"], root["redux"], root["rx"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_31__, __WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_0__) {
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

/***/ 11:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_js_cookie__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_js_cookie___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_js_cookie__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rx__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rx___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rx__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_redux__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_redux___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_redux__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__ = __webpack_require__(4);
/**
 * Auth middle handles all the server communication and cookie managmenet
 * related to login actions.
 *
 * We assume that the login API provides *both* an auth token and the member
 * object corresponding to the login credentials
 *
 * @module AuthMiddleware
 */





/**
 * login sub responds to only the most recent login request, and can be disposed
 * by a logout
 * @const
 */
var loginSub = new __WEBPACK_IMPORTED_MODULE_1_rx___default.a.SerialDisposable();
loginSub.setDisposable(__WEBPACK_IMPORTED_MODULE_1_rx___default.a.Disposable.empty);

/**
 * There are 6 login-related actions:
 *
 * 1. 'LOGIN_REQUEST' - send credentials for login
 * 2. 'LOGIN_SUCCESS' - updates local state/cookie from api response
 * 3. 'LOGIN_ERROR' - server failed to login user with supplied credentials
 * 4. 'LOGOUT_REQUEST' - return to default state and request anonymous
 *   auth token from server
 * 5. 'LOGOUT_SUCCESS' - new anonymous auth token returned
 * 6. 'LOGOUT_ERROR' - server failed to get anonymous auth token - fatal
 */
var AuthMiddleware = function AuthMiddleware(store) {
	return function (next) {
		return function (action) {
			var actions = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2_redux__["bindActionCreators"])({
				logoutSuccess: __WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__["logoutSuccess"],
				logoutError: __WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__["logoutError"]
			}, store.dispatch);

			var oauth_token = void 0,
			    response = void 0;
			switch (action.type) {
				case 'LOGIN_SUCCESS':
					response = action.payload;
					oauth_token = response.value.oauth_token;
					__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.set('oauth_token', oauth_token);
					__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.remove('anonymous');
					// re-sync the page
					store.dispatch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__["configureAuth"])({ oauth_token: oauth_token }));
					break;
				case 'LOGIN_ERROR':
					break;
				case 'LOGOUT_REQUEST':
					__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.remove('oauth_token');
					fetch('/anon') // application server route to serve anonymous tokens
					.then(function (response) {
						return response.json();
					}).catch(function (e) {
						return Promise.reject([e]);
					}).then(actions.logoutSuccess, actions.logoutError);
					break;
				case 'LOGOUT_SUCCESS':
					response = action.payload;
					oauth_token = response.access_token;
					__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.set('oauth_token', oauth_token);
					__WEBPACK_IMPORTED_MODULE_0_js_cookie___default.a.set('anonymous', true);
					// re-sync the page
					store.dispatch(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__actions_authActionCreators__["configureAuth"])({ anonymous: true, oauth_token: oauth_token }));
					break;
				case 'LOGOUT_ERROR':
					break;
			}
			return next(action);
		};
	};
};

/* harmony default export */ exports["default"] = AuthMiddleware;

/***/ },

/***/ 31:
/***/ function(module, exports) {

module.exports = require("js-cookie");

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

/***/ },

/***/ 40:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(11);


/***/ }

/******/ })
});
;