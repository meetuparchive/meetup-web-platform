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

	/**
	 * Auth middle handles all the server communication and cookie managmenet
	 * related to login actions.
	 *
	 * We assume that the login API provides *both* an auth token and the member
	 * object corresponding to the login credentials
	 *
	 * @module AuthMiddleware
	 */
	import Cookies from 'js-cookie';
	import Rx from 'rx';
	import { bindActionCreators } from 'redux';
	import { logoutSuccess, logoutError, configureAuth } from '../actions/authActionCreators';

	/**
	 * login sub responds to only the most recent login request, and can be disposed
	 * by a logout
	 * @const
	 */
	var loginSub = new Rx.SerialDisposable();
	loginSub.setDisposable(Rx.Disposable.empty);

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
				var actions = bindActionCreators({
					logoutSuccess: logoutSuccess,
					logoutError: logoutError
				}, store.dispatch);

				var oauth_token = void 0,
				    response = void 0;
				switch (action.type) {
					case 'LOGIN_SUCCESS':
						response = action.payload;
						oauth_token = response.value.oauth_token;
						Cookies.set('oauth_token', oauth_token);
						Cookies.remove('anonymous');
						// re-sync the page
						store.dispatch(configureAuth({ oauth_token: oauth_token }));
						break;
					case 'LOGIN_ERROR':
						break;
					case 'LOGOUT_REQUEST':
						Cookies.remove('oauth_token');
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
						Cookies.set('oauth_token', oauth_token);
						Cookies.set('anonymous', true);
						// re-sync the page
						store.dispatch(configureAuth({ anonymous: true, oauth_token: oauth_token }));
						break;
					case 'LOGOUT_ERROR':
						break;
				}
				return next(action);
			};
		};
	};

	export default AuthMiddleware;

/***/ }
/******/ ]);